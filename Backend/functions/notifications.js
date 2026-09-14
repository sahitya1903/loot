// Loot — low-level FCM helpers.
//
// Higher-level alert templates live in loot_alert.js. This file only handles
// token storage and multicast delivery.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { error as _error } from "firebase-functions/logger";

const messaging = getMessaging();
const db = getFirestore();

/**
 * Read all FCM tokens for a user across registered devices.
 */
async function getUserFcmTokens(userId) {
  const accountPrefsDoc = await db
    .collection("users").doc(userId)
    .collection("accountPreferences").doc(userId)
    .get();

  if (!accountPrefsDoc.exists) return [];
  const data = accountPrefsDoc.data();
  return (data?.fcmTokens || []).filter(Boolean);
}

/**
 * Send an FCM message to all of a user's devices. Auto-prunes invalid tokens.
 */
export async function sendToUserDevices(userId, message) {
  const tokens = await getUserFcmTokens(userId);
  if (tokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({ tokens, ...message });

  if (response.failureCount > 0) {
    const invalid = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalid.push(tokens[idx]);
        }
      }
    });
    if (invalid.length > 0) {
      try {
        await db.collection("users").doc(userId)
          .collection("accountPreferences").doc(userId)
          .update({ fcmTokens: FieldValue.arrayRemove(...invalid) });
      } catch (err) {
        _error(`sendToUserDevices: token cleanup failed for ${userId}`, err);
      }
    }
  }
}

// ============================================================================
// registerFcmToken — client calls this on app start with the device token
// ============================================================================

export const registerFcmToken = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { token } = request.data || {};
  if (typeof token !== "string" || token.length < 10) {
    throw new Error("invalid-argument");
  }
  await db.collection("users").doc(uid)
    .collection("accountPreferences").doc(uid)
    .set({
      fcmTokens: FieldValue.arrayUnion(token),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  return { success: true };
});

// ============================================================================
// unregisterFcmToken — call on logout
// ============================================================================

export const unregisterFcmToken = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { token } = request.data || {};
  if (typeof token !== "string") throw new Error("invalid-argument");

  await db.collection("users").doc(uid)
    .collection("accountPreferences").doc(uid)
    .update({ fcmTokens: FieldValue.arrayRemove(token) });
  return { success: true };
});

// ============================================================================
// markAlertRead — flip readAt on a notification
// ============================================================================

export const markAlertRead = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { alertId } = request.data || {};
  if (!alertId) throw new Error("invalid-argument");

  await db.collection("users").doc(uid).collection("notifications").doc(alertId)
    .update({ readAt: FieldValue.serverTimestamp() });
  return { success: true };
});

// ============================================================================
// listMyAlerts — paged list of notifications
// ============================================================================

export const listMyAlerts = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { cursor = null, limit = 30 } = request.data || {};
  const lim = Math.max(1, Math.min(50, Number(limit) || 30));

  let q = db.collection("users").doc(uid).collection("notifications")
    .orderBy("createdAt", "desc").limit(lim);
  if (cursor) {
    const { Timestamp } = await import("firebase-admin/firestore");
    q = q.startAfter(Timestamp.fromMillis(Number(cursor)));
  }
  const snap = await q.get();
  const alerts = snap.docs.map(d => ({ alertId: d.id, ...d.data() }));
  const last = snap.docs[snap.docs.length - 1]?.data()?.createdAt;
  return {
    success: true,
    alerts,
    cursor: snap.size === lim && last ? last.toMillis() : null,
    hasMore: snap.size === lim,
  };
});
