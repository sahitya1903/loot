// Loot — trending detection, locality clustering, ranking helpers.
//
// Computes per-loot `trendingScore` and `velocityScore` every 10 minutes,
// flips `active` → `trending` when score crosses the locality threshold,
// and rolls up a denormalized `localities/{geoCellId}` snapshot.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";

const db = getFirestore();

// Trending scoring window — engagement in this window matters most
const VELOCITY_WINDOW_HOURS = 3;
const TRENDING_PROMOTION_PERCENTILE = 0.85; // top 15% in their geoHash-5 cell promote

// ============================================================================
// recomputeTrendingScore — every 10 minutes
// ============================================================================

export const recomputeTrendingScore = onSchedule({
  schedule: "*/10 * * * *",
  timeZone: "Asia/Kolkata",
  memory: "512MiB",
  timeoutSeconds: 540,
}, async () => {
  const snap = await db.collection("loots")
    .where("status", "in", ["active", "trending", "expiring"])
    .limit(2000)
    .get();

  // Group by geoHash-5 cell
  const byCell = new Map();
  for (const doc of snap.docs) {
    const data = doc.data();
    const cell = (data.geoHash || "").slice(0, 5);
    if (!byCell.has(cell)) byCell.set(cell, []);
    byCell.get(cell).push({ id: doc.id, data });
  }

  const promoted = [];
  const demoted = [];

  for (const [cell, items] of byCell.entries()) {
    // Compute velocity per loot — claims-per-hour over the recent window
    const scored = await Promise.all(items.map(async ({ id, data }) => {
      const velocity = await computeVelocity(id, data);
      const trending = computeTrendingScore(data, velocity);
      return { id, data, velocity, trending };
    }));

    // Sort and take top percentile
    scored.sort((a, b) => b.trending - a.trending);
    const cutIdx = Math.floor(scored.length * (1 - TRENDING_PROMOTION_PERCENTILE));

    for (let i = 0; i < scored.length; i++) {
      const { id, data, velocity, trending } = scored[i];
      const shouldBeTrending = i < cutIdx && data.status !== "expiring";
      const update = {
        trendingScore: trending,
        velocityScore: velocity,
      };
      if (shouldBeTrending && data.status !== "trending") {
        update.status = "trending";
        promoted.push(id);
      } else if (!shouldBeTrending && data.status === "trending") {
        update.status = "active";
        demoted.push(id);
      }
      try {
        await db.collection("loots").doc(id).update(update);
      } catch (err) {
        _error(`recomputeTrendingScore: update failed ${id}`, err);
      }
    }

    // Roll up locality snapshot
    if (cell) {
      await rollupLocality(cell, scored);
    }
  }

  info(`recomputeTrendingScore: promoted=${promoted.length} demoted=${demoted.length} cells=${byCell.size}`);
});

async function computeVelocity(lootId, loot) {
  // claims/saves accrued in the recent window. Cheap: counts subcollection by
  // a server-side timestamp filter.
  const since = new Date(Date.now() - VELOCITY_WINDOW_HOURS * 3600_000);
  try {
    const claims = await db.collection("loots").doc(lootId).collection("claims")
      .where("claimedAt", ">", since)
      .count().get();
    const saves = await db.collection("loots").doc(lootId).collection("saves")
      .where("savedAt", ">", since)
      .count().get();
    return claims.data().count * 1.0 + saves.data().count * 0.4; // claims weighted higher
  } catch (err) {
    _error(`computeVelocity failed for ${lootId}`, err);
    return 0;
  }
}

function computeTrendingScore(loot, velocity) {
  // Composite score — same shape as the SQL ranker but cheaper for batch.
  const ageHours = ageInHours(loot.createdAt);
  const expiryHours = expiryRemainingHours(loot.expiryAt);

  return (
    1.0 * Math.tanh(velocity / 5)                      // velocity (capped tanh)
    + 0.4 * Math.log1p(loot.saveCount || 0)            // saves
    + 0.6 * Math.log1p(loot.claimCount || 0)           // claims
    + 0.3 * Math.log1p(loot.shareCount || 0)           // shares
    + 0.4 * Math.exp(-ageHours / 24)                   // freshness
    + 0.3 * (1 - Math.min(Math.max(expiryHours / 24, 0), 1)) // urgency
  );
}

function ageInHours(ts) {
  if (!ts || typeof ts.toMillis !== "function") return 0;
  return (Date.now() - ts.toMillis()) / 3600_000;
}

function expiryRemainingHours(ts) {
  if (!ts || typeof ts.toMillis !== "function") return 0;
  return Math.max(0, (ts.toMillis() - Date.now()) / 3600_000);
}

async function rollupLocality(geoCellId, scored) {
  const top = scored.slice(0, 10).map(s => s.id);
  const categoryCounts = new Map();
  for (const { data } of scored) {
    const c = data.category || "other";
    categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  await db.collection("localities").doc(geoCellId).set({
    geoCellId,
    topLootIds: top,
    topCategories,
    activeLootCount: scored.length,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

// ============================================================================
// getLocalityTrend — read denormalized snapshot
// ============================================================================

export const getLocalityTrend = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const { geoCellId } = request.data || {};
  if (!geoCellId) throw new Error("invalid-argument");
  const doc = await db.collection("localities").doc(geoCellId).get();
  if (!doc.exists) return { success: true, trend: null };
  return { success: true, trend: doc.data() };
});
