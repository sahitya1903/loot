// Loot — FCM alert dispatchers.
//
// Templates focus on discovery + urgency. Forbidden: any event-style copy
// ("starts tomorrow", "attendees joined", "schedule updated").

import "./options.js";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { error as _error, info } from "firebase-functions/logger";
import { sendToUserDevices } from "./notifications.js";

const db = getFirestore();

// ============================================================================
// Template builders
// ============================================================================

function timeLeftLabel(expiryAt) {
  const ms = (expiryAt?.toMillis?.() ?? 0) - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const templates = {
  new_loot_nearby: (loot, business, distanceKm) => ({
    title: `🚨 New loot near you`,
    body: `${business.businessName}: ${loot.title}${distanceKm ? ` · ${distanceKm}km away` : ""}`,
  }),
  loot_ending_soon: (loot, business) => ({
    title: `⏳ Ends in ${timeLeftLabel(loot.expiryAt)}`,
    body: `${loot.title} — claim before it's gone`,
  }),
  trending_near_you: (loot, business, distanceKm) => ({
    title: `🔥 Trending ${distanceKm ? `${distanceKm}km away` : "near you"}`,
    body: `${loot.title} from ${business.businessName}`,
  }),
  followed_business_drop: (loot, business) => ({
    title: `${business.businessName} just dropped`,
    body: `${loot.title}`,
  }),
  claim_velocity: (loot, business) => ({
    title: `🔥 ${loot.claimCount}+ people just claimed this`,
    body: `${loot.title} — ${business.businessName}`,
  }),
};

async function dispatchAlert(userId, type, lootId, businessId, payload, imageUrl) {
  await db.collection("users").doc(userId).collection("notifications").add({
    type,
    lootId,
    businessId,
    title: payload.title,
    body: payload.body,
    imageUrl: imageUrl || null,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
  });

  try {
    await sendToUserDevices(userId, {
      notification: { title: payload.title, body: payload.body, imageUrl },
      data: { type, lootId: String(lootId), businessId: String(businessId) },
    });
  } catch (err) {
    _error(`dispatchAlert(${type}): FCM failed for user ${userId}`, err);
  }
}

// ============================================================================
// Public dispatchers
// ============================================================================

export async function dispatchNewLootNearby(lootId, loot, viewerUid, distanceKm) {
  const business = await loadBusiness(loot.businessId);
  if (!business) return;
  const payload = templates.new_loot_nearby(loot, business, distanceKm);
  await dispatchAlert(viewerUid, "new_loot_nearby", lootId, loot.businessId, payload);
}

export async function dispatchLootEndingSoon(lootId, loot) {
  const business = await loadBusiness(loot.businessId);
  if (!business) return;

  // Notify everyone who saved it (but didn't claim yet)
  const saversSnap = await db.collection("loots").doc(lootId).collection("saves").get();
  const claimersSnap = await db.collection("loots").doc(lootId).collection("claims").get();
  const claimedUids = new Set(claimersSnap.docs.map(d => d.id));

  const targets = saversSnap.docs.map(d => d.id).filter(uid => !claimedUids.has(uid));
  const payload = templates.loot_ending_soon(loot, business);

  let sent = 0;
  for (const uid of targets) {
    try {
      await dispatchAlert(uid, "loot_ending_soon", lootId, loot.businessId, payload);
      sent++;
    } catch (err) {
      _error(`endingSoon dispatch failed user=${uid}`, err);
    }
  }
  info(`dispatchLootEndingSoon: lootId=${lootId} sent=${sent}`);
}

export async function dispatchTrendingNearYou(lootId, loot, viewerUid, distanceKm) {
  const business = await loadBusiness(loot.businessId);
  if (!business) return;
  const payload = templates.trending_near_you(loot, business, distanceKm);
  await dispatchAlert(viewerUid, "trending_near_you", lootId, loot.businessId, payload);
}

export async function dispatchFollowedBusinessDrop(lootId, loot, followerUid) {
  const business = await loadBusiness(loot.businessId);
  if (!business) return;
  const payload = templates.followed_business_drop(loot, business);
  await dispatchAlert(followerUid, "followed_business_drop", lootId, loot.businessId, payload);
}

export async function dispatchClaimVelocity(lootId, loot, targetUids) {
  const business = await loadBusiness(loot.businessId);
  if (!business) return;
  const payload = templates.claim_velocity(loot, business);
  for (const uid of targetUids) {
    try {
      await dispatchAlert(uid, "claim_velocity", lootId, loot.businessId, payload);
    } catch (err) {
      _error(`claim_velocity dispatch failed user=${uid}`, err);
    }
  }
}

async function loadBusiness(businessId) {
  if (!businessId) return null;
  const doc = await db.collection("businesses").doc(businessId).get();
  return doc.exists ? doc.data() : null;
}

// ============================================================================
// Trigger: on follower fanout, send a "followed business drop" alert
// ============================================================================

export const onFollowerFeedItemAdded = onDocumentCreated({
  document: "users/{userId}/feed/{lootId}",
}, async (event) => {
  const { userId, lootId } = event.params;
  const item = event.data?.data();
  if (!item || item.source !== "following") return;

  try {
    const lootDoc = await db.collection("loots").doc(lootId).get();
    if (!lootDoc.exists) return;
    await dispatchFollowedBusinessDrop(lootId, lootDoc.data(), userId);
  } catch (err) {
    _error(`onFollowerFeedItemAdded alert failed user=${userId} loot=${lootId}`, err);
  }
});
