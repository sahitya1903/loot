// Loot — geospatial sync + nearby query.
//
// Mirrors active loot to Neon Postgres + PostGIS so we can run
// `ST_DWithin` + ranked SQL for the Nearby feed without paying Firestore's
// non-indexable-distance tax.
//
// Adapted from the previous `nearbyEvents.js` pipeline. Status-driven instead
// of time-window-driven: only loots in {active, trending, expiring} are mirrored.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";
import { error as _error, info } from "firebase-functions/logger";

const db = getFirestore();

const NEON_DATABASE_URL = defineSecret("NEON_DATABASE_URL");

const VISIBLE_STATUSES = new Set(["active", "trending", "expiring"]);

async function getNeonSql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(NEON_DATABASE_URL.value());
}

function isMirrorable(loot) {
  if (!loot) return false;
  if (!VISIBLE_STATUSES.has(loot.status)) return false;
  if (typeof loot.latitude !== "number" || typeof loot.longitude !== "number") return false;
  if (loot.latitude < -90 || loot.latitude > 90) return false;
  if (loot.longitude < -180 || loot.longitude > 180) return false;
  if (!loot.expiryAt) return false;
  return true;
}

function expiryMs(loot) {
  if (!loot.expiryAt) return null;
  if (typeof loot.expiryAt.toMillis === "function") return loot.expiryAt.toMillis();
  if (typeof loot.expiryAt === "number") return loot.expiryAt;
  return null;
}

async function upsertLoot(sql, lootId, loot) {
  const expIso = new Date(expiryMs(loot)).toISOString();
  await sql`
    INSERT INTO loots_geo (
      loot_id, business_id, category, loot_type, status,
      expiry_at, visibility_radius_km, geog,
      trending_score, velocity_score, save_count, claim_count,
      updated_at
    )
    VALUES (
      ${lootId},
      ${loot.businessId || ""},
      ${loot.category || ""},
      ${loot.lootType || ""},
      ${loot.status},
      ${expIso}::timestamptz,
      ${Number(loot.visibilityRadiusKm) || 5},
      ST_SetSRID(ST_MakePoint(${loot.longitude}, ${loot.latitude}), 4326)::geography,
      ${Number(loot.trendingScore) || 0},
      ${Number(loot.velocityScore) || 0},
      ${Number(loot.saveCount) || 0},
      ${Number(loot.claimCount) || 0},
      NOW()
    )
    ON CONFLICT (loot_id) DO UPDATE SET
      business_id          = EXCLUDED.business_id,
      category             = EXCLUDED.category,
      loot_type            = EXCLUDED.loot_type,
      status               = EXCLUDED.status,
      expiry_at            = EXCLUDED.expiry_at,
      visibility_radius_km = EXCLUDED.visibility_radius_km,
      geog                 = EXCLUDED.geog,
      trending_score       = EXCLUDED.trending_score,
      velocity_score       = EXCLUDED.velocity_score,
      save_count           = EXCLUDED.save_count,
      claim_count          = EXCLUDED.claim_count,
      updated_at           = NOW()
  `;
}

async function deleteLootRow(sql, lootId) {
  await sql`DELETE FROM loots_geo WHERE loot_id = ${lootId}`;
}

// ============================================================================
// Trigger: mirror loot writes to Neon
// ============================================================================

export const onLootWrittenForNearby = onDocumentWritten({
  secrets: ["NEON_DATABASE_URL"],
  document: "loots/{lootId}",
}, async (event) => {
  const { lootId } = event.params;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  const before = event.data?.before?.exists ? event.data.before.data() : null;

  try {
    const sql = await getNeonSql();

    if (!after) {
      await deleteLootRow(sql, lootId);
      return;
    }

    const wasMirror = isMirrorable(before);
    const isMirror = isMirrorable(after);

    if (!isMirror) {
      if (wasMirror) await deleteLootRow(sql, lootId);
      return;
    }

    await upsertLoot(sql, lootId, after);
  } catch (err) {
    _error(`onLootWrittenForNearby: sync failed for ${lootId}`, err);
  }
});

// ============================================================================
// Callable: getNearbyLoot — ranked geo query
// ============================================================================

/**
 * Composite ranking is computed in SQL:
 *   score = w_dist     * exp(-distM / 1500)             // distance decay
 *         + w_freshness* exp(-ageH / 6)                  // newer wins
 *         + w_urgency  * (1 - clamp(timeLeftH / 24, 0, 1)) // ending soon wins
 *         + w_velocity * tanh(velocity_score / 10)
 *         + w_save     * ln(1 + save_count)
 *         + w_trending * tanh(trending_score / 50)
 *
 * Weights live here so they can be tuned. Avoid letting any single signal
 * dominate; paid boosts are applied via a multiplier capped at 1.3 elsewhere.
 */
const W_DIST = 1.0;
const W_FRESH = 0.6;
const W_URGENCY = 0.7;
const W_VELOCITY = 0.5;
const W_SAVE = 0.3;
const W_TRENDING = 0.5;

export const getNearbyLoot = onCall({
  secrets: ["NEON_DATABASE_URL"],
}, async (request) => {
  if (!request.auth?.uid) {
    return { success: false, errorMessage: "unauthenticated" };
  }

  const {
    latitude,
    longitude,
    radiusKm = 5,
    category = null,
    cursor = null,
    limit = 20,
  } = request.data || {};

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { success: false, errorMessage: "latitude/longitude required" };
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { success: false, errorMessage: "lat/lng out of range" };
  }

  const radius = Math.max(0.5, Math.min(50, Number(radiusKm) || 5));
  const lim = Math.max(1, Math.min(50, Number(limit) || 20));
  const radiusM = radius * 1000;

  const cursorScore = cursor && typeof cursor.score === "number" ? cursor.score : null;
  const cursorId = cursor && typeof cursor.lootId === "string" ? cursor.lootId : null;
  const useCursor = cursorScore != null && cursorId != null;

  try {
    const sql = await getNeonSql();
    const point = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;

    const scoreSql = sql`
      (
        ${W_DIST} * EXP(-ST_Distance(geog, ${point}) / 1500.0)
        + ${W_FRESH}    * EXP(-EXTRACT(EPOCH FROM (NOW() - updated_at)) / 21600.0)
        + ${W_URGENCY}  * (1 - LEAST(GREATEST(EXTRACT(EPOCH FROM (expiry_at - NOW())) / 86400.0, 0), 1))
        + ${W_VELOCITY} * TANH(velocity_score / 10.0)
        + ${W_SAVE}     * LN(1 + save_count)
        + ${W_TRENDING} * TANH(trending_score / 50.0)
      )
    `;

    let rows;
    const categoryFilter = category ? sql`AND category = ${category}` : sql``;
    const cursorFilter = useCursor
      ? sql`AND (${scoreSql}, loot_id) < (${cursorScore}, ${cursorId})`
      : sql``;

    rows = await sql`
      SELECT
        loot_id,
        ST_Distance(geog, ${point}) AS distance_m,
        ${scoreSql} AS score
      FROM loots_geo
      WHERE ST_DWithin(geog, ${point}, ${radiusM})
        AND expiry_at > NOW()
        AND status IN ('active', 'trending', 'expiring')
        ${categoryFilter}
        ${cursorFilter}
      ORDER BY score DESC, loot_id ASC
      LIMIT ${lim}
    `;

    const items = rows.map(r => ({
      lootId: r.loot_id,
      distanceKm: Math.round((Number(r.distance_m) / 1000) * 100) / 100,
      score: Number(r.score),
    }));

    const nextCursor = items.length === lim
      ? { score: items[items.length - 1].score, lootId: items[items.length - 1].lootId }
      : null;

    return { success: true, items, cursor: nextCursor, hasMore: nextCursor !== null };
  } catch (err) {
    _error("getNearbyLoot failed", err);
    return { success: false, errorMessage: err.message || "geo query failed" };
  }
});

// ============================================================================
// Reconciler — cheap insurance against trigger drift
// ============================================================================

export const reconcileNearbyLoot = onSchedule({
  secrets: ["NEON_DATABASE_URL"],
  schedule: "30 3 * * *",
  timeZone: "Asia/Kolkata",
  memory: "512MiB",
  timeoutSeconds: 540,
}, async () => {
  const sql = await getNeonSql();
  const BATCH_SIZE = 500;
  let upserts = 0, removed = 0;
  const liveIds = new Set();
  let lastDoc = null;

  while (true) {
    let q = db.collection("loots")
      .where("status", "in", ["active", "trending", "expiring"])
      .orderBy("__name__")
      .limit(BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snapshot = await q.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!isMirrorable(data)) continue;
      liveIds.add(doc.id);
      try {
        await upsertLoot(sql, doc.id, data);
        upserts++;
      } catch (err) {
        _error(`reconcileNearbyLoot: upsert failed for ${doc.id}`, err);
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < BATCH_SIZE) break;
  }

  // Remove rows whose Firestore counterpart is gone or no longer visible.
  let lastSeen = "";
  while (true) {
    const rows = await sql`
      SELECT loot_id FROM loots_geo
      WHERE loot_id > ${lastSeen}
      ORDER BY loot_id ASC
      LIMIT 1000
    `;
    if (rows.length === 0) break;
    for (const row of rows) {
      if (!liveIds.has(row.loot_id)) {
        try {
          await deleteLootRow(sql, row.loot_id);
          removed++;
        } catch (err) {
          _error(`reconcileNearbyLoot: delete failed for ${row.loot_id}`, err);
        }
      }
    }
    lastSeen = rows[rows.length - 1].loot_id;
    if (rows.length < 1000) break;
  }

  info(`reconcileNearbyLoot: upserts=${upserts} removed=${removed} liveIds=${liveIds.size}`);
});
