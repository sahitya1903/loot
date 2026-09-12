// Loot — counter rollups.
//
// Most engagement counters (saveCount, claimCount, viewCount, shareCount) are
// incremented inline at write time in loot.js / claim.js. This file holds the
// triggers that need eventually-consistent rollups across collections —
// followersCount, totalClaimsCount, savesCount.

import "./options.js";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { error as _error } from "firebase-functions/logger";

const db = getFirestore();

const safeInc = async (docRef, field, change) => {
  try {
    await docRef.set({
      [field]: FieldValue.increment(change),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    _error(`counters: increment ${field} failed on ${docRef.path}`, err);
  }
};

// ============================================================================
// User-level counters
// ============================================================================

// users/{userId}/savedLoot — derived from per-loot save subcollection too,
// but mirrored here for the personal "saves count" badge.
export const onUserSavedLootCreated = onDocumentCreated({
  document: "users/{userId}/savedLoot/{lootId}",
}, async (event) => {
  await safeInc(db.collection("users").doc(event.params.userId), "savesCount", 1);
});

export const onUserSavedLootDeleted = onDocumentDeleted({
  document: "users/{userId}/savedLoot/{lootId}",
}, async (event) => {
  await safeInc(db.collection("users").doc(event.params.userId), "savesCount", -1);
});

export const onUserClaimedLootCreated = onDocumentCreated({
  document: "users/{userId}/claimedLoot/{lootId}",
}, async (event) => {
  await safeInc(db.collection("users").doc(event.params.userId), "claimsCount", 1);
});

// ============================================================================
// Business-level counters — totalClaimsCount across all of a business's loots
// ============================================================================

export const onLootClaimCreated = onDocumentCreated({
  document: "loots/{lootId}/claims/{userId}",
}, async (event) => {
  const lootDoc = await db.collection("loots").doc(event.params.lootId).get();
  if (!lootDoc.exists) return;
  const businessId = lootDoc.data().businessId;
  if (!businessId) return;
  await safeInc(db.collection("businesses").doc(businessId), "totalClaimsCount", 1);
});
