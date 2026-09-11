// Loot — account-type guards.
//
// Loot has exactly two account types: 'personal' (consume) and 'professional'
// (create + manage loot). There is no per-loot RBAC — a loot's owner business
// is the only account that can mutate it.

import { getFirestore } from "firebase-admin/firestore";
import { warn, error as _error } from "firebase-functions/logger";

const db = getFirestore();

export const ACCOUNT_TYPES = {
  PERSONAL: "personal",
  PROFESSIONAL: "professional",
};

/**
 * Read the account type for a user. Returns null if the user doc does not exist.
 */
export async function getAccountType(userId) {
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return null;
    return doc.data().accountType || null;
  } catch (err) {
    _error(`getAccountType: failed for user ${userId}`, err);
    return null;
  }
}

/**
 * Throw a permission-denied error unless the calling user is a pro account.
 * Use at the top of every callable that mutates loot or business resources.
 */
export async function requireProfessional(userId) {
  const type = await getAccountType(userId);
  if (type !== ACCOUNT_TYPES.PROFESSIONAL) {
    throw new Error("permission-denied: professional account required");
  }
}

/**
 * Throw a permission-denied error unless the calling user is a personal account.
 * Use on consumer-only mutations (claim, save, react, review).
 */
export async function requirePersonal(userId) {
  const type = await getAccountType(userId);
  if (type !== ACCOUNT_TYPES.PERSONAL) {
    throw new Error("permission-denied: personal account required");
  }
}

/**
 * Verify the calling pro user owns the given business document.
 */
export async function requireBusinessOwnership(userId, businessId) {
  const doc = await db.collection("businesses").doc(businessId).get();
  if (!doc.exists) throw new Error("not-found: business does not exist");
  if (doc.data().ownerUserId !== userId) {
    throw new Error("permission-denied: not the business owner");
  }
}

/**
 * Verify the calling user owns the loot (i.e. owns the loot's business).
 * Returns the loot data on success.
 */
export async function requireLootOwnership(userId, lootId) {
  const lootDoc = await db.collection("loots").doc(lootId).get();
  if (!lootDoc.exists) throw new Error("not-found: loot does not exist");
  const loot = lootDoc.data();
  await requireBusinessOwnership(userId, loot.businessId);
  return loot;
}

/**
 * Soft helper used by routes that surface optional pro-only fields.
 */
export async function isProfessional(userId) {
  return (await getAccountType(userId)) === ACCOUNT_TYPES.PROFESSIONAL;
}
