// Loot — cascade deletion handlers.

import "./options.js";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { error as _error, info } from "firebase-functions/logger";

const db = getFirestore();

async function deleteSubcollections(docRef) {
  const subs = await docRef.listCollections();
  for (const sub of subs) {
    const docs = await sub.get();
    for (const d of docs.docs) {
      await deleteSubcollections(d.ref);
      await d.ref.delete();
    }
  }
}

// ============================================================================
// onUserDeleted — clean up user-scoped subcollections
// ============================================================================

export const onUserDeleted = onDocumentDeleted({
  document: "users/{userId}",
}, async (event) => {
  const userId = event.params.userId;
  try {
    await deleteSubcollections(db.collection("users").doc(userId));
    info(`safeDeletes.onUserDeleted: cleaned ${userId}`);
  } catch (err) {
    _error(`onUserDeleted cleanup failed for ${userId}`, err);
  }
});

// ============================================================================
// onLootDeleted — clean up loot subcollections (rare; archive is the norm)
// ============================================================================

export const onLootDeleted = onDocumentDeleted({
  document: "loots/{lootId}",
}, async (event) => {
  const lootId = event.params.lootId;
  try {
    await deleteSubcollections(db.collection("loots").doc(lootId));
    info(`safeDeletes.onLootDeleted: cleaned ${lootId}`);
  } catch (err) {
    _error(`onLootDeleted cleanup failed for ${lootId}`, err);
  }
});

// ============================================================================
// onBusinessDeleted — release username, cascade
// ============================================================================

export const onBusinessDeleted = onDocumentDeleted({
  document: "businesses/{businessId}",
}, async (event) => {
  const businessId = event.params.businessId;
  const before = event.data?.data();
  try {
    if (before?.username) {
      await db.collection("usernames").doc(before.username).delete().catch(() => {});
    }
    await deleteSubcollections(db.collection("businesses").doc(businessId));
    info(`safeDeletes.onBusinessDeleted: cleaned ${businessId}`);
  } catch (err) {
    _error(`onBusinessDeleted cleanup failed for ${businessId}`, err);
  }
});
