// Loot — feed surfaces (Nearby, Following, Trending, Fresh) + fanout to followers.
//
// Heavy reads (Nearby) defer to nearbyLoot.js (Postgres+PostGIS). The feeds
// here either hydrate from per-user materialized indices (Following) or
// query Firestore by indexed predicates (Fresh, Trending).
//
// Fanout writes a thin shadow doc per follower so Following feed scales linearly
// in followers without bloating the loot doc itself.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";

const db = getFirestore();

const FEED_FANOUT_BATCH_SIZE = 400;
const FRESH_FEED_DEFAULT_RADIUS_KM = 5;
const FRESH_FEED_LOOKBACK_HOURS = 12;

// ============================================================================
// Trigger: fanout new loot to followers
// ============================================================================

export const fanoutLootToFollowers = onDocumentCreated({
  document: "loots/{lootId}",
}, async (event) => {
  const lootId = event.params.lootId;
  const loot = event.data?.data();
  if (!loot || loot.status === "draft") return;

  await fanoutLoot(lootId, loot);
});

export const fanoutLootOnPublish = onDocumentUpdated({
  document: "loots/{lootId}",
}, async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  if (before.status === "draft" && after.status === "active") {
    await fanoutLoot(event.params.lootId, after);
  }
});

async function fanoutLoot(lootId, loot) {
  const businessId = loot.businessId;
  if (!businessId) return;

  const followersRef = db.collection("businesses").doc(businessId).collection("followers");
  let lastDoc = null;
  let total = 0;

  while (true) {
    let q = followersRef.orderBy("__name__").limit(FEED_FANOUT_BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const f of snap.docs) {
      const followerUid = f.id;
      const feedRef = db.collection("users").doc(followerUid).collection("feed").doc(lootId);
      batch.set(feedRef, {
        lootId,
        businessId,
        addedAt: FieldValue.serverTimestamp(),
        expiryAt: loot.expiryAt,
        category: loot.category,
        source: "following",
      }, { merge: true });
    }
    await batch.commit();
    total += snap.size;

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < FEED_FANOUT_BATCH_SIZE) break;
  }
  info(`fanoutLoot: lootId=${lootId} business=${businessId} fannedOut=${total}`);
}

// ============================================================================
// Trigger: backfill followee's recent loots when someone follows
// ============================================================================

export const backfillFollowFeed = onDocumentCreated({
  document: "users/{userId}/following/{businessId}",
}, async (event) => {
  const { userId, businessId } = event.params;
  try {
    const recent = await db.collection("loots")
      .where("businessId", "==", businessId)
      .where("status", "in", ["active", "trending", "expiring"])
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const batch = db.batch();
    for (const doc of recent.docs) {
      const data = doc.data();
      const feedRef = db.collection("users").doc(userId).collection("feed").doc(doc.id);
      batch.set(feedRef, {
        lootId: doc.id,
        businessId,
        addedAt: FieldValue.serverTimestamp(),
        expiryAt: data.expiryAt,
        category: data.category,
        source: "following_backfill",
      }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    _error(`backfillFollowFeed failed user=${userId} business=${businessId}`, err);
  }
});

// ============================================================================
// getFollowingFeed
// ============================================================================

export const getFollowingFeed = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { cursor = null, limit = 20 } = request.data || {};
  const lim = Math.max(1, Math.min(50, Number(limit) || 20));

  let q = db.collection("users").doc(uid).collection("feed")
    .orderBy("addedAt", "desc")
    .limit(lim);
  if (cursor) q = q.startAfter(Timestamp.fromMillis(Number(cursor)));

  const snap = await q.get();
  const lootIds = snap.docs.map(d => d.data().lootId);
  const items = await hydrateFeedItems(lootIds);

  const lastAdded = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].data().addedAt : null;
  const nextCursor = snap.size === lim && lastAdded ? lastAdded.toMillis() : null;

  return { success: true, items, cursor: nextCursor, hasMore: nextCursor !== null };
});

// ============================================================================
// getFreshFeed
// ============================================================================

export const getFreshFeed = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { latitude, longitude, radiusKm = FRESH_FEED_DEFAULT_RADIUS_KM, category, limit = 20 } = request.data || {};
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("invalid-argument: lat/lng required");
  }
  const lim = Math.max(1, Math.min(50, Number(limit) || 20));
  const cutoff = Timestamp.fromMillis(Date.now() - FRESH_FEED_LOOKBACK_HOURS * 3600_000);

  let q = db.collection("loots")
    .where("status", "in", ["active", "trending"])
    .orderBy("createdAt", "desc")
    .limit(lim * 3);

  if (category) q = q.where("category", "==", category);

  const snap = await q.get();
  const inWindow = snap.docs
    .filter(d => {
      const data = d.data();
      const created = data.createdAt?.toMillis?.() ?? 0;
      if (created < cutoff.toMillis()) return false;
      return haversineKm(latitude, longitude, data.latitude, data.longitude) <= radiusKm;
    })
    .slice(0, lim);

  const items = await hydrateFeedItems(inWindow.map(d => d.id), { latitude, longitude });
  return { success: true, items, cursor: null, hasMore: false };
});

// ============================================================================
// getTrendingFeed
// ============================================================================

export const getTrendingFeed = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { geoCellId, latitude, longitude, category, limit = 20 } = request.data || {};
  const lim = Math.max(1, Math.min(50, Number(limit) || 20));

  if (geoCellId) {
    const localityDoc = await db.collection("localities").doc(geoCellId).get();
    if (localityDoc.exists) {
      const ids = (localityDoc.data().topLootIds || []).slice(0, lim);
      const items = await hydrateFeedItems(ids, { latitude, longitude });
      return { success: true, items, cursor: null, hasMore: false };
    }
  }

  let q = db.collection("loots")
    .where("status", "==", "trending")
    .orderBy("trendingScore", "desc")
    .limit(lim);
  if (category) q = q.where("category", "==", category);
  const snap = await q.get();
  const items = await hydrateFeedItems(snap.docs.map(d => d.id), { latitude, longitude });
  return { success: true, items, cursor: null, hasMore: false };
});

// ============================================================================
// getBusinessLoot — list a business's currently-visible loots
// ============================================================================

export const getBusinessLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { businessId, status = "all_active", limit = 20 } = request.data || {};
  if (!businessId) throw new Error("invalid-argument");
  const lim = Math.max(1, Math.min(50, Number(limit) || 20));

  let q = db.collection("loots").where("businessId", "==", businessId);
  if (status === "all_active") {
    q = q.where("status", "in", ["active", "trending", "expiring"]);
  } else {
    q = q.where("status", "==", status);
  }
  q = q.orderBy("createdAt", "desc").limit(lim);

  const snap = await q.get();
  const items = await hydrateFeedItems(snap.docs.map(d => d.id));
  return { success: true, items, cursor: null, hasMore: false };
});

// ============================================================================
// helpers
// ============================================================================

async function hydrateFeedItems(lootIds, viewerCoords = null) {
  if (lootIds.length === 0) return [];

  const lootDocs = await db.getAll(...lootIds.map(id => db.collection("loots").doc(id)));
  const businessIdSet = new Set();
  for (const d of lootDocs) {
    if (d.exists) businessIdSet.add(d.data().businessId);
  }

  const businessDocs = businessIdSet.size > 0
    ? await db.getAll(...[...businessIdSet].map(id => db.collection("businesses").doc(id)))
    : [];
  const businessById = new Map();
  for (const b of businessDocs) {
    if (b.exists) businessById.set(b.id, b.data());
  }

  return lootDocs
    .filter(d => d.exists)
    .map(d => {
      const data = d.data();
      const business = businessById.get(data.businessId);
      const distanceKm = viewerCoords && typeof viewerCoords.latitude === "number"
        ? Math.round(haversineKm(viewerCoords.latitude, viewerCoords.longitude, data.latitude, data.longitude) * 100) / 100
        : null;
      return {
        id: d.id,
        businessId: data.businessId,
        businessName: business?.businessName || "",
        businessUsername: business?.username || "",
        businessVerified: !!business?.verified,
        businessLogo: business?.logo || null,
        title: data.title,
        thumbnailUrl: null,
        primaryMediaUrl: null,
        primaryMediaType: data.media?.[0]?.mediaType || "image",
        category: data.category,
        status: data.status,
        expiryAt: data.expiryAt,
        distanceKm,
        claimCount: data.claimCount || 0,
        saveCount: data.saveCount || 0,
        trendingScore: data.trendingScore || 0,
      };
    });
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
