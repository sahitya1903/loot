// Loot — claim, save, share, and redemption issuance.
//
// All mutations here are personal-account actions. claimLoot is idempotent
// (one claim per user per loot) and atomically issues a Redemption.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";
import { randomUUID } from "node:crypto";

import { requirePersonal } from "./roles.js";

const db = getFirestore();

const REDEMPTION_TTL_HOURS = 24;

function shortCode() {
  // 8-char ambiguity-safe code: avoids 0/O/1/I/L
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `LOOT-${code}`;
}

// ============================================================================
// claimLoot — atomic claim + redemption issuance
// ============================================================================

export const claimLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requirePersonal(uid);

  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument: lootId required");

  const lootRef = db.collection("loots").doc(lootId);
  const claimRef = lootRef.collection("claims").doc(uid);
  const redemptionRef = lootRef.collection("redemptions").doc(uid);
  const userClaimedRef = db.collection("users").doc(uid).collection("claimedLoot").doc(lootId);

  const result = await db.runTransaction(async (tx) => {
    const lootSnap = await tx.get(lootRef);
    if (!lootSnap.exists) throw new Error("not-found: loot does not exist");
    const loot = lootSnap.data();
    if (!["active", "trending", "expiring"].includes(loot.status)) {
      throw new Error("failed-precondition: loot not claimable");
    }
    const expiryMs = loot.expiryAt?.toMillis?.() ?? 0;
    if (expiryMs <= Date.now()) {
      throw new Error("failed-precondition: loot has expired");
    }

    const existing = await tx.get(claimRef);
    if (existing.exists) {
      // Idempotent — return the existing redemption
      const r = await tx.get(redemptionRef);
      return { redemption: r.exists ? r.data() : null, alreadyClaimed: true };
    }

    const now = Date.now();
    const expiresAt = Timestamp.fromMillis(Math.min(expiryMs, now + REDEMPTION_TTL_HOURS * 3600_000));

    const redemption = {
      redemptionId: randomUUID(),
      userId: uid,
      lootId,
      businessId: loot.businessId,
      branchId: loot.branchId || null,
      redemptionType: loot.redemptionType,
      code: loot.redemptionType === "none" ? null : shortCode(),
      qrPayload: null,
      status: "issued",
      issuedAt: FieldValue.serverTimestamp(),
      expiresAt,
    };
    redemption.qrPayload = JSON.stringify({ rid: redemption.redemptionId, lid: lootId, uid });

    tx.set(claimRef, {
      userId: uid,
      lootId,
      claimedAt: FieldValue.serverTimestamp(),
      redemptionId: redemption.redemptionId,
    });
    tx.set(redemptionRef, redemption);
    tx.set(userClaimedRef, {
      lootId,
      claimedAt: FieldValue.serverTimestamp(),
      redemptionId: redemption.redemptionId,
    });
    tx.update(lootRef, { claimCount: FieldValue.increment(1) });

    return { redemption, alreadyClaimed: false };
  });

  info(`claim ${result.alreadyClaimed ? "(idempotent)" : "issued"} for loot=${lootId} user=${uid}`);
  return { success: true, redemption: result.redemption };
});

// ============================================================================
// saveLoot / unsaveLoot
// ============================================================================

export const saveLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requirePersonal(uid);

  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");

  const lootRef = db.collection("loots").doc(lootId);
  const saveRef = lootRef.collection("saves").doc(uid);
  const userSaveRef = db.collection("users").doc(uid).collection("savedLoot").doc(lootId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(saveRef);
    if (existing.exists) return;
    tx.set(saveRef, { userId: uid, lootId, savedAt: FieldValue.serverTimestamp() });
    tx.set(userSaveRef, { lootId, savedAt: FieldValue.serverTimestamp() });
    tx.update(lootRef, { saveCount: FieldValue.increment(1) });
  });

  return { success: true };
});

export const unsaveLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");

  const lootRef = db.collection("loots").doc(lootId);
  const saveRef = lootRef.collection("saves").doc(uid);
  const userSaveRef = db.collection("users").doc(uid).collection("savedLoot").doc(lootId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(saveRef);
    if (!existing.exists) return;
    tx.delete(saveRef);
    tx.delete(userSaveRef);
    tx.update(lootRef, { saveCount: FieldValue.increment(-1) });
  });

  return { success: true };
});

// ============================================================================
// shareLoot — log share, increment counter
// ============================================================================

export const shareLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { lootId, channel = "other" } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");

  const lootRef = db.collection("loots").doc(lootId);
  const shareRef = lootRef.collection("shares").doc();

  const batch = db.batch();
  batch.set(shareRef, {
    userId: uid,
    lootId,
    channel,
    sharedAt: FieldValue.serverTimestamp(),
  });
  batch.update(lootRef, { shareCount: FieldValue.increment(1) });
  await batch.commit();

  return { success: true };
});

// ============================================================================
// getRedemption
// ============================================================================

export const getRedemption = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { redemptionId } = request.data || {};
  if (!redemptionId) throw new Error("invalid-argument");

  // Lookup via the user's claimedLoot index — avoids a collectionGroup query.
  // Front-end already has `lootId` when it routes to a claim sheet, so prefer:
  //   getRedemptionByLoot(lootId)
  // which is cheaper and used below.
  throw new Error("unimplemented: use getRedemptionByLoot(lootId) instead");
});

export const getRedemptionByLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");

  const doc = await db.collection("loots").doc(lootId).collection("redemptions").doc(uid).get();
  if (!doc.exists) throw new Error("not-found");
  return { success: true, redemption: doc.data() };
});

// ============================================================================
// reviewLoot
// ============================================================================

export const reviewLoot = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requirePersonal(uid);

  const { lootId, rating, text } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    throw new Error("invalid-argument: rating must be 1-5");
  }

  const reviewRef = db.collection("loots").doc(lootId).collection("reviews").doc(uid);
  await reviewRef.set({
    userId: uid,
    lootId,
    rating,
    text: typeof text === "string" ? text.slice(0, 1000) : null,
    reviewedAt: FieldValue.serverTimestamp(),
  });
  return { success: true };
});
