// Loot — pro analytics (pro-only).

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { info } from "firebase-functions/logger";

import { requireProfessional, requireLootOwnership, requireBusinessOwnership } from "./roles.js";

const db = getFirestore();

// ============================================================================
// getLootAnalytics — per-loot funnel
// ============================================================================

export const getLootAnalytics = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { lootId } = request.data || {};
  if (!lootId) throw new Error("invalid-argument");
  const loot = await requireLootOwnership(uid, lootId);

  // Counters live on the loot doc; views subcollection is a sample, used for
  // hour-of-day bucketing.
  const lootRef = db.collection("loots").doc(lootId);
  const [viewSnap, claimSnap, redemptionSnap] = await Promise.all([
    lootRef.collection("views").orderBy("timestamp", "desc").limit(1000).get(),
    lootRef.collection("claims").get(),
    lootRef.collection("redemptions").where("status", "==", "used").get(),
  ]);

  const uniqueViewers = new Set(viewSnap.docs.map(d => d.data().userId).filter(Boolean));

  // 24-bucket hour-of-day timeline
  const timeline = Array.from({ length: 24 }, (_, hour) => ({ hour, impressions: 0, claims: 0 }));
  for (const v of viewSnap.docs) {
    const ts = v.data().timestamp?.toMillis?.() ?? 0;
    if (ts) timeline[new Date(ts).getHours()].impressions++;
  }
  for (const c of claimSnap.docs) {
    const ts = c.data().claimedAt?.toMillis?.() ?? 0;
    if (ts) timeline[new Date(ts).getHours()].claims++;
  }

  const claims = claimSnap.size;
  const used = redemptionSnap.size;
  const claimRate = uniqueViewers.size > 0 ? claims / uniqueViewers.size : 0;
  const completionRate = claims > 0 ? used / claims : 0;

  return {
    success: true,
    data: {
      impressions: loot.viewCount || 0,
      uniqueViewers: uniqueViewers.size,
      saves: loot.saveCount || 0,
      claims,
      shares: loot.shareCount || 0,
      claimRate,
      completionRate,
      timeline,
    },
  };
});

// ============================================================================
// getBusinessAnalytics — business-wide rollup
// ============================================================================

export const getBusinessAnalytics = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const businessId = uid;
  await requireBusinessOwnership(uid, businessId);

  const businessDoc = await db.collection("businesses").doc(businessId).get();
  const business = businessDoc.data() || {};

  const lootsSnap = await db.collection("loots")
    .where("businessId", "==", businessId)
    .where("status", "in", ["active", "trending", "expiring"])
    .get();

  let totalImpressions = 0;
  let totalShares = 0;
  let totalClaims = 0;

  const branchStats = new Map();
  for (const branch of business.branchLocations || []) {
    branchStats.set(branch.branchId, { branchId: branch.branchId, name: branch.name, claims: 0, impressions: 0 });
  }

  for (const doc of lootsSnap.docs) {
    const data = doc.data();
    totalImpressions += data.viewCount || 0;
    totalShares += data.shareCount || 0;
    totalClaims += data.claimCount || 0;
    if (data.branchId && branchStats.has(data.branchId)) {
      const stats = branchStats.get(data.branchId);
      stats.claims += data.claimCount || 0;
      stats.impressions += data.viewCount || 0;
    }
  }

  return {
    success: true,
    data: {
      activeLoot: lootsSnap.size,
      totalImpressions,
      totalClaims,
      totalShares,
      followerGrowth: 0, // requires historic snapshots; wire up when we add daily aggregator
      branchPerformance: [...branchStats.values()].sort((a, b) => b.claims - a.claims),
    },
  };
});
