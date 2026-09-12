// Loot — core CRUD callables.
//
// Pro-only mutations: createLoot, updateLoot, archiveLoot.
// Public reads: getLoot, getLootMediaUrls.
// Telemetry: trackLootView (signed-in users).

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { error as _error, info } from "firebase-functions/logger";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl as cfGetSignedUrl } from "@aws-sdk/cloudfront-signer";
import { randomUUID } from "node:crypto";

import { requireProfessional, requireBusinessOwnership, requireLootOwnership } from "./roles.js";

const db = getFirestore();

const S3_BUCKET = defineString("S3_BUCKET");
const S3_REGION = defineString("S3_REGION");
const AWS_ACCESS_KEY_ID = defineSecret("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = defineSecret("AWS_SECRET_ACCESS_KEY");
const CLOUDFRONT_DOMAIN = defineString("CLOUDFRONT_DOMAIN");
const CLOUDFRONT_KEY_PAIR_ID = defineString("CLOUDFRONT_KEY_PAIR_ID");
const CLOUDFRONT_PRIVATE_KEY = defineSecret("CLOUDFRONT_PRIVATE_KEY");

const MEDIA_URL_TTL_SECONDS = 60 * 60; // 1 hour

const VALID_LOOT_TYPES = new Set(["deal", "drop", "experience", "flash", "opportunity"]);
const VALID_REDEMPTION_TYPES = new Set(["in_store", "online_code", "first_come", "none"]);
const VALID_CATEGORIES = new Set([
  "food_drink", "nightlife", "retail", "wellness", "entertainment",
  "services", "experiences", "flash_commerce", "creator", "other",
]);

function s3Client() {
  return new S3Client({
    region: S3_REGION.value(),
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID.value(),
      secretAccessKey: AWS_SECRET_ACCESS_KEY.value(),
    },
  });
}

function geoHash(lat, lng, precision = 7) {
  // 7-char geoHash — good for ~150m cells. Compact and good enough for our uses.
  // (Encoded inline to avoid a new dep; replace with `ngeohash` if hot path.)
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
  let bits = 0, bitsTotal = 0, hashIdx = 0, even = true;
  let out = "";
  while (out.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) { hashIdx = (hashIdx << 1) + 1; minLng = mid; }
      else { hashIdx = hashIdx << 1; maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) { hashIdx = (hashIdx << 1) + 1; minLat = mid; }
      else { hashIdx = hashIdx << 1; maxLat = mid; }
    }
    even = !even;
    if (++bitsTotal % 5 === 0) {
      out += BASE32[hashIdx];
      hashIdx = 0;
      bits = 0;
    } else {
      bits++;
    }
  }
  return out;
}

// ============================================================================
// createLoot
// ============================================================================

export const createLoot = onCall({
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  memory: "256MiB",
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated: sign in required");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const {
    title,
    description = "",
    category,
    tags = [],
    lootType,
    redemptionType,
    expiryAt,
    visibilityRadiusKm = 5,
    branchId,
    outletInfo,
    terms,
    mediaCount,
  } = request.data || {};

  // Validation
  if (typeof title !== "string" || title.length < 3 || title.length > 80) {
    throw new Error("invalid-argument: title must be 3-80 chars");
  }
  if (description.length > 500) {
    throw new Error("invalid-argument: description max 500 chars");
  }
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error("invalid-argument: unknown category");
  }
  if (!VALID_LOOT_TYPES.has(lootType)) {
    throw new Error("invalid-argument: unknown lootType");
  }
  if (!VALID_REDEMPTION_TYPES.has(redemptionType)) {
    throw new Error("invalid-argument: unknown redemptionType");
  }
  if (typeof expiryAt !== "number" || expiryAt <= Date.now()) {
    throw new Error("invalid-argument: expiryAt must be a future timestamp");
  }
  if (typeof mediaCount !== "number" || mediaCount < 1 || mediaCount > 6) {
    throw new Error("invalid-argument: mediaCount must be 1-6");
  }
  if (visibilityRadiusKm < 0.5 || visibilityRadiusKm > 50) {
    throw new Error("invalid-argument: visibilityRadiusKm must be 0.5-50");
  }

  // Resolve business + branch geo
  const businessSnap = await db.collection("users").doc(uid).get();
  const businessId = businessSnap.exists ? businessSnap.data().businessId : null;
  if (!businessId) throw new Error("failed-precondition: pro account has no businessId");
  await requireBusinessOwnership(uid, businessId);
  const businessDoc = await db.collection("businesses").doc(businessId).get();
  const business = businessDoc.data();

  let branch = null;
  if (branchId) {
    branch = (business.branchLocations || []).find(b => b.branchId === branchId);
    if (!branch) throw new Error("invalid-argument: branchId not found on business");
  } else if ((business.branchLocations || []).length === 1) {
    branch = business.branchLocations[0];
  } else {
    throw new Error("invalid-argument: branchId required when business has multiple branches");
  }

  const lootRef = db.collection("loots").doc();
  const lootId = lootRef.id;

  // Generate presigned upload slots — client uploads, then calls attachLootMedia
  const bucket = S3_BUCKET.value();
  const client = s3Client();
  const uploadSlots = [];
  for (let i = 0; i < mediaCount; i++) {
    const s3Key = `loot/${businessId}/${lootId}/${i}-${randomUUID()}.bin`;
    const presigned = await createPresignedPost(client, {
      Bucket: bucket,
      Key: s3Key,
      Conditions: [
        ["content-length-range", 0, 50 * 1024 * 1024], // 50MB cap
      ],
      Expires: 600,
    });
    uploadSlots.push({ slot: i, uploadUrl: presigned.url, fields: presigned.fields, s3Key });
  }

  await lootRef.set({
    id: lootId,
    businessId,
    branchId: branch.branchId,
    title,
    description,
    media: [], // populated by attachLootMedia after upload
    category,
    tags: tags.slice(0, 10),
    terms: terms || null,

    location: { name: branch.name, placeId: branch.placeId || null },
    latitude: branch.latitude,
    longitude: branch.longitude,
    geoHash: geoHash(branch.latitude, branch.longitude, 7),
    visibilityRadiusKm,

    status: "draft", // becomes 'active' after attachLootMedia succeeds
    lootType,
    redemptionType,
    outletInfo: outletInfo || null,

    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiryAt: Timestamp.fromMillis(expiryAt),

    viewCount: 0,
    saveCount: 0,
    claimCount: 0,
    shareCount: 0,
    trendingScore: 0,
    velocityScore: 0,
  });

  info(`loot ${lootId} created (draft) by business ${businessId}`);
  return { success: true, lootId, uploadSlots };
});

// ============================================================================
// attachLootMedia — called by client after S3 uploads complete; flips draft→active
// ============================================================================

export const attachLootMedia = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { lootId, media } = request.data || {};
  if (!lootId || !Array.isArray(media) || media.length === 0) {
    throw new Error("invalid-argument: lootId + media[] required");
  }
  await requireLootOwnership(uid, lootId);

  // Sanitize media items
  const cleanMedia = media.map(m => ({
    s3Key: String(m.s3Key),
    mimeType: String(m.mimeType || "application/octet-stream"),
    mediaType: m.mediaType === "video" ? "video" : "image",
    durationMs: typeof m.durationMs === "number" ? m.durationMs : null,
    width: typeof m.width === "number" ? m.width : null,
    height: typeof m.height === "number" ? m.height : null,
  }));

  await db.collection("loots").doc(lootId).update({
    media: cleanMedia,
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ============================================================================
// updateLoot
// ============================================================================

export const updateLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { lootId, ...patch } = request.data || {};
  if (!lootId) throw new Error("invalid-argument: lootId required");

  const loot = await requireLootOwnership(uid, lootId);
  if (loot.status === "expired" || loot.status === "archived") {
    throw new Error("failed-precondition: cannot edit expired or archived loot");
  }

  const update = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof patch.title === "string" && patch.title.length >= 3 && patch.title.length <= 80) update.title = patch.title;
  if (typeof patch.description === "string" && patch.description.length <= 500) update.description = patch.description;
  if (VALID_CATEGORIES.has(patch.category)) update.category = patch.category;
  if (Array.isArray(patch.tags)) update.tags = patch.tags.slice(0, 10);
  if (typeof patch.expiryAt === "number" && patch.expiryAt > Date.now()) {
    update.expiryAt = Timestamp.fromMillis(patch.expiryAt);
  }
  if (typeof patch.visibilityRadiusKm === "number" && patch.visibilityRadiusKm >= 0.5 && patch.visibilityRadiusKm <= 50) {
    update.visibilityRadiusKm = patch.visibilityRadiusKm;
  }
  if (typeof patch.terms === "string") update.terms = patch.terms;
  if (patch.outletInfo && typeof patch.outletInfo === "object") update.outletInfo = patch.outletInfo;

  await db.collection("loots").doc(lootId).update(update);
  return { success: true };
});

// ============================================================================
// archiveLoot
// ============================================================================

export const archiveLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument: lootId required");

  await requireLootOwnership(request.auth.uid, lootId);
  await db.collection("loots").doc(lootId).update({
    status: "archived",
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// ============================================================================
// getLoot — public read with signed media URLs
// ============================================================================

export const getLoot = onCall({
  secrets: ["CLOUDFRONT_PRIVATE_KEY"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument: lootId required");

  const doc = await db.collection("loots").doc(lootId).get();
  if (!doc.exists) throw new Error("not-found: loot does not exist");
  const loot = doc.data();

  if (!["active", "trending", "expiring"].includes(loot.status)) {
    // Owner can still see drafts/archived
    const isOwner = await isLootOwner(request.auth.uid, loot.businessId);
    if (!isOwner) throw new Error("not-found");
  }

  const mediaUrls = (loot.media || []).map(m => signMedia(m.s3Key));
  return { success: true, loot, mediaUrls };
});

async function isLootOwner(uid, businessId) {
  if (!businessId) return false;
  const b = await db.collection("businesses").doc(businessId).get();
  return b.exists && b.data().ownerUserId === uid;
}

function signMedia(s3Key) {
  const url = `https://${CLOUDFRONT_DOMAIN.value()}/${s3Key}`;
  return cfGetSignedUrl({
    url,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID.value(),
    privateKey: CLOUDFRONT_PRIVATE_KEY.value(),
    dateLessThan: new Date(Date.now() + MEDIA_URL_TTL_SECONDS * 1000).toISOString(),
  });
}

// ============================================================================
// getLootMediaUrls — refresh signed URLs without rehydrating the full loot
// ============================================================================

export const getLootMediaUrls = onCall({
  secrets: ["CLOUDFRONT_PRIVATE_KEY"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument: lootId required");

  const doc = await db.collection("loots").doc(lootId).get();
  if (!doc.exists) throw new Error("not-found");
  const loot = doc.data();

  const urls = (loot.media || []).map(m => ({
    url: signMedia(m.s3Key),
    thumbnailUrl: m.thumbnailS3Key ? signMedia(m.thumbnailS3Key) : null,
    mimeType: m.mimeType,
    mediaType: m.mediaType,
  }));
  return { success: true, urls };
});

// ============================================================================
// trackLootView — fire-and-forget telemetry
// ============================================================================

export const trackLootView = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { lootId, source = "feed", watchTimeMs } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");

  const lootRef = db.collection("loots").doc(lootId);
  const viewRef = lootRef.collection("views").doc();

  // Atomic increment + sample log. Don't store every view long-term (costly);
  // counters.js sampler handles aggregation/expiry.
  const batch = db.batch();
  batch.set(viewRef, {
    userId: uid,
    source,
    watchTimeMs: typeof watchTimeMs === "number" ? watchTimeMs : null,
    timestamp: FieldValue.serverTimestamp(),
  });
  batch.update(lootRef, { viewCount: FieldValue.increment(1) });
  await batch.commit();
  return { success: true };
});
