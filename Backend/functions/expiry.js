// Loot — lifecycle scheduler.
//
// Drives the state machine: active → trending → expiring → expired → archived.
// Runs every 5 minutes. Cheap because it queries by (status, expiryAt) which
// is indexed.

import "./options.js";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";

import { dispatchLootEndingSoon } from "./loot_alert.js";

const db = getFirestore();

const ENDING_SOON_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2h
const ARCHIVE_AFTER_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

// ============================================================================
// advanceLifecycle — every 5 minutes
// ============================================================================

export const advanceLifecycle = onSchedule({
  schedule: "*/5 * * * *",
  timeZone: "Asia/Kolkata",
  memory: "512MiB",
  timeoutSeconds: 300,
}, async () => {
  const now = Date.now();
  let activeToExpiring = 0, trendingToExpiring = 0, expiringToExpired = 0, expiredToArchived = 0;

  // 1. active → expiring  (within 2h of expiry)
  const expiringThreshold = Timestamp.fromMillis(now + ENDING_SOON_THRESHOLD_MS);
  const activeSnap = await db.collection("loots")
    .where("status", "==", "active")
    .where("expiryAt", "<=", expiringThreshold)
    .limit(500)
    .get();

  for (const doc of activeSnap.docs) {
    await doc.ref.update({ status: "expiring", updatedAt: FieldValue.serverTimestamp() });
    activeToExpiring++;
    try {
      await dispatchLootEndingSoon(doc.id, doc.data());
    } catch (err) {
      _error(`advanceLifecycle: ending-soon dispatch failed for ${doc.id}`, err);
    }
  }

  // 1b. trending → expiring (a trending loot still has to flip when expiry < 2h)
  const trendingSnap = await db.collection("loots")
    .where("status", "==", "trending")
    .where("expiryAt", "<=", expiringThreshold)
    .limit(500)
    .get();

  for (const doc of trendingSnap.docs) {
    await doc.ref.update({ status: "expiring", updatedAt: FieldValue.serverTimestamp() });
    trendingToExpiring++;
  }

  // 2. expiring → expired  (now >= expiryAt)
  const expiringSnap = await db.collection("loots")
    .where("status", "==", "expiring")
    .where("expiryAt", "<=", Timestamp.fromMillis(now))
    .limit(500)
    .get();

  for (const doc of expiringSnap.docs) {
    await doc.ref.update({ status: "expired", updatedAt: FieldValue.serverTimestamp() });
    expiringToExpired++;
  }

  // 3. expired → archived  (24h after expiry)
  const archiveThreshold = Timestamp.fromMillis(now - ARCHIVE_AFTER_EXPIRY_MS);
  const expiredSnap = await db.collection("loots")
    .where("status", "==", "expired")
    .where("expiryAt", "<=", archiveThreshold)
    .limit(500)
    .get();

  for (const doc of expiredSnap.docs) {
    await doc.ref.update({ status: "archived", updatedAt: FieldValue.serverTimestamp() });
    expiredToArchived++;
  }

  info(`advanceLifecycle: a→ex=${activeToExpiring} tr→ex=${trendingToExpiring} ex→exp=${expiringToExpired} exp→arch=${expiredToArchived}`);
});

// ============================================================================
// recomputeBusinessLootCount — keep `businesses/{id}.lootCount` accurate when
// loots transition to/from visible states. Runs every 30 min.
// ============================================================================

export const recomputeBusinessLootCount = onSchedule({
  schedule: "*/30 * * * *",
  timeZone: "Asia/Kolkata",
  memory: "256MiB",
  timeoutSeconds: 300,
}, async () => {
  const businessesSnap = await db.collection("businesses").limit(1000).get();
  for (const businessDoc of businessesSnap.docs) {
    const businessId = businessDoc.id;
    const visibleSnap = await db.collection("loots")
      .where("businessId", "==", businessId)
      .where("status", "in", ["active", "trending", "expiring"])
      .count()
      .get();
    const visibleCount = visibleSnap.data().count;
    if (visibleCount !== businessDoc.data().lootCount) {
      await businessDoc.ref.update({ lootCount: visibleCount });
    }
  }
});
