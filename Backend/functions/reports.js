// Loot — content reports & moderation queue.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { info } from "firebase-functions/logger";

const db = getFirestore();

const VALID_REASONS = new Set([
  "misleading",
  "inappropriate",
  "scam",
  "expired_inaccurate",
  "spam",
  "other",
]);

// ============================================================================
// reportLoot — user submits a report on a loot
// ============================================================================

export const reportLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;

  const { lootId, reason, description } = request.data || {};
  if (!lootId) throw new Error("invalid-argument: lootId required");
  if (!VALID_REASONS.has(reason)) throw new Error("invalid-argument: unknown reason");

  const reportRef = db.collection("loots").doc(lootId).collection("reports").doc(uid);
  const queueRef = db.collection("moderationQueue").doc();

  const batch = db.batch();
  batch.set(reportRef, {
    userId: uid,
    lootId,
    reason,
    description: typeof description === "string" ? description.slice(0, 1000) : null,
    reportedAt: FieldValue.serverTimestamp(),
  });
  batch.set(queueRef, {
    type: "loot_report",
    lootId,
    reportedBy: uid,
    reason,
    description: typeof description === "string" ? description.slice(0, 1000) : null,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  info(`reportLoot lootId=${lootId} by=${uid} reason=${reason}`);
  return { success: true };
});

// ============================================================================
// reportBusiness — user submits a report on a business
// ============================================================================

export const reportBusiness = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;

  const { businessId, reason, description } = request.data || {};
  if (!businessId) throw new Error("invalid-argument: businessId required");
  if (!VALID_REASONS.has(reason)) throw new Error("invalid-argument: unknown reason");

  const queueRef = db.collection("moderationQueue").doc();
  await queueRef.set({
    type: "business_report",
    businessId,
    reportedBy: uid,
    reason,
    description: typeof description === "string" ? description.slice(0, 1000) : null,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});
