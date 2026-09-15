// Loot — Razorpay integration.
//
// Two purposes for Loot:
//   1) Professional account subscriptions — unlock multi-branch, analytics,
//      higher monthly loot creation cap.
//   2) Per-loot boost orders — flat-fee orders processed on confirmation by
//      activateBoost in boost.js.
//
// Plan metadata convention (set in Razorpay dashboard "notes"):
//   monthlyLootLimit   — e.g. "30"
//   analyticsEnabled   — "true" / "false"
//   multiBranchEnabled — "true" / "false"

import "./options.js";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";
import crypto from "node:crypto";

import { requireProfessional } from "./roles.js";
import { activateBoost } from "./boost.js";

const db = getFirestore();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

async function getRazorpayInstance() {
  const Razorpay = (await import("razorpay")).default;
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID.value(),
    key_secret: RAZORPAY_KEY_SECRET.value(),
  });
}

function parsePlanMeta(plan) {
  const notes = plan.notes || {};
  const period = plan.period === "yearly" ? "annual" : plan.period;
  return {
    planId: plan.id,
    name: plan.item?.name || "Unnamed",
    description: plan.item?.description || "",
    monthlyLootLimit: parseInt(notes.monthlyLootLimit || "30", 10),
    analyticsEnabled: notes.analyticsEnabled === "true",
    multiBranchEnabled: notes.multiBranchEnabled === "true",
    period,
    priceINR: plan.item?.amount ? plan.item.amount / 100 : 0,
    razorpayPlanId: plan.id,
  };
}

// ============================================================================
// getProSubscriptionPlans
// ============================================================================

export const getProSubscriptionPlans = onCall({
  secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const rzp = await getRazorpayInstance();
  const { items } = await rzp.plans.all({ count: 100 });
  const plans = (items || [])
    .map(parsePlanMeta)
    .filter(p => p.period && p.priceINR > 0);
  return { success: true, plans };
});

// ============================================================================
// createProSubscription
// ============================================================================

export const createProSubscription = onCall({
  secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { planId } = request.data || {};
  if (!planId) throw new Error("invalid-argument: planId required");

  const rzp = await getRazorpayInstance();
  const subscription = await rzp.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    notes: { uid },
  });

  await db.collection("businesses").doc(uid).collection("subscription").doc("current").set({
    razorpaySubscriptionId: subscription.id,
    razorpayPlanId: planId,
    status: subscription.status,
    isActive: false, // flips true on first webhook 'activated'
    willRenew: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    success: true,
    subscriptionId: subscription.id,
    razorpayKey: RAZORPAY_KEY_ID.value(),
  };
});

// ============================================================================
// cancelProSubscription
// ============================================================================

export const cancelProSubscription = onCall({
  secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const subRef = db.collection("businesses").doc(uid).collection("subscription").doc("current");
  const subDoc = await subRef.get();
  if (!subDoc.exists) throw new Error("not-found: no active subscription");
  const subId = subDoc.data().razorpaySubscriptionId;

  const rzp = await getRazorpayInstance();
  await rzp.subscriptions.cancel(subId, { cancel_at_cycle_end: 1 });

  await subRef.update({
    willRenew: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ============================================================================
// getProSubscriptionStatus
// ============================================================================

export const getProSubscriptionStatus = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;

  const subDoc = await db.collection("businesses").doc(uid).collection("subscription").doc("current").get();
  if (!subDoc.exists) {
    return { success: true, subscription: null };
  }
  return { success: true, subscription: subDoc.data() };
});

// ============================================================================
// razorpayWebhook — verifies signature, dispatches by event type
// ============================================================================

export const razorpayWebhook = onRequest({
  secrets: ["RAZORPAY_WEBHOOK_SECRET"],
}, async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body = req.rawBody?.toString("utf8") || "";
  const expected = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET.value())
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    _error("razorpayWebhook: signature mismatch");
    res.status(400).send("invalid signature");
    return;
  }

  let event;
  try { event = JSON.parse(body); } catch {
    res.status(400).send("invalid json");
    return;
  }

  const eventType = event.event;
  info(`razorpayWebhook: ${eventType}`);

  try {
    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged":
        await onSubscriptionActive(event);
        break;
      case "subscription.cancelled":
      case "subscription.completed":
        await onSubscriptionEnded(event);
        break;
      case "order.paid":
        await onBoostPaid(event);
        break;
    }
    res.status(200).send("ok");
  } catch (err) {
    _error("razorpayWebhook: handler failed", err);
    res.status(500).send("internal");
  }
});

async function onSubscriptionActive(event) {
  const sub = event.payload?.subscription?.entity;
  if (!sub) return;
  const uid = sub.notes?.uid;
  if (!uid) return;

  await db.collection("businesses").doc(uid).collection("subscription").doc("current").set({
    razorpaySubscriptionId: sub.id,
    razorpayPlanId: sub.plan_id,
    status: sub.status,
    isActive: true,
    currentStart: sub.current_start ? Timestamp.fromMillis(sub.current_start * 1000) : null,
    currentEnd: sub.current_end ? Timestamp.fromMillis(sub.current_end * 1000) : null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function onSubscriptionEnded(event) {
  const sub = event.payload?.subscription?.entity;
  if (!sub) return;
  const uid = sub.notes?.uid;
  if (!uid) return;

  await db.collection("businesses").doc(uid).collection("subscription").doc("current").set({
    status: sub.status,
    isActive: false,
    willRenew: false,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function onBoostPaid(event) {
  const order = event.payload?.order?.entity;
  const payment = event.payload?.payment?.entity;
  if (!order || !payment) return;

  const lootId = order.notes?.lootId;
  const durationHours = parseInt(order.notes?.durationHours || "0", 10);
  if (!lootId || !durationHours) return;

  await activateBoost(lootId, durationHours, payment.id);
}
