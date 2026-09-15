// Loot — paid boosts (pro-only).
//
// Boost contributes to ranking via a *capped multiplier* (max 1.3) — never
// dominates organic signal. See discovery.js / nearbyLoot.js for how the
// boost flag feeds into score composition.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";

import { requireProfessional, requireLootOwnership } from "./roles.js";

const db = getFirestore();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

const BOOST_PRICING = {
  6: 199,
  12: 349,
  24: 599,
  48: 999,
};

// ============================================================================
// createBoost — creates a Razorpay order, returns checkout details
// ============================================================================

export const createBoost = onCall({
  secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { lootId, durationHours } = request.data || {};
  if (!lootId || ![6, 12, 24, 48].includes(durationHours)) {
    throw new Error("invalid-argument: lootId + durationHours in (6,12,24,48) required");
  }

  await requireLootOwnership(uid, lootId);

  const amountINR = BOOST_PRICING[durationHours];
  const amountPaise = amountINR * 100;

  const Razorpay = (await import("razorpay")).default;
  const rzp = new Razorpay({
    key_id: RAZORPAY_KEY_ID.value(),
    key_secret: RAZORPAY_KEY_SECRET.value(),
  });

  const order = await rzp.orders.create({
    amount: amountPaise,
    currency: "INR",
    notes: { lootId, durationHours: String(durationHours), userId: uid },
  });

  await db.collection("loots").doc(lootId).collection("boostOrders").doc(order.id).set({
    orderId: order.id,
    durationHours,
    amountINR,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    razorpayOrderId: order.id,
    razorpayKey: RAZORPAY_KEY_ID.value(),
    amountINR,
  };
});

// ============================================================================
// activateBoost — called from the Razorpay webhook handler in razorpay.js once
// payment is confirmed. Flips loot.boost = { active: true, … } with capped multiplier.
// ============================================================================

export async function activateBoost(lootId, durationHours, paymentId) {
  const startedAt = Date.now();
  const endsAt = startedAt + durationHours * 3600_000;

  await db.collection("loots").doc(lootId).update({
    boost: {
      active: true,
      multiplier: 1.3, // CAP — do not let any single signal dominate ranking
      startedAt: Timestamp.fromMillis(startedAt),
      endsAt: Timestamp.fromMillis(endsAt),
      paymentId: paymentId || null,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  info(`boost activated lootId=${lootId} durationHours=${durationHours}`);
}

// ============================================================================
// expireBoosts — sweep ended boosts off; runs every 15 minutes
// ============================================================================

export const expireBoosts = onSchedule({
  schedule: "*/15 * * * *",
  timeZone: "Asia/Kolkata",
}, async () => {
  const now = Timestamp.fromMillis(Date.now());
  const snap = await db.collection("loots")
    .where("boost.active", "==", true)
    .where("boost.endsAt", "<=", now)
    .limit(500)
    .get();

  for (const doc of snap.docs) {
    await doc.ref.update({
      "boost.active": false,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
});
