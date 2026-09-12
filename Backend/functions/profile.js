// Loot — user profile mutations.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { info, error as _error } from "firebase-functions/logger";

const db = getFirestore();

const S3_BUCKET = defineString("S3_BUCKET");
const S3_REGION = defineString("S3_REGION");
const AWS_ACCESS_KEY_ID = defineSecret("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = defineSecret("AWS_SECRET_ACCESS_KEY");

// ============================================================================
// onUserCreated — initialize new user record + accountPreferences
// ============================================================================

export const onUserCreated = onDocumentCreated({
  document: "users/{userId}",
}, async (event) => {
  const userId = event.params.userId;
  const accountPrefsRef = db.collection("users").doc(userId).collection("accountPreferences").doc(userId);
  await accountPrefsRef.set({
    fcmTokens: [],
    notificationsEnabled: true,
    theme: "dark",
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  info(`accountPreferences initialized for ${userId}`);
});

// ============================================================================
// updateProfile — name, about, interests, service city
// ============================================================================

export const updateProfile = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { name, about, interests, serviceCity, serviceCityCoordinates } = request.data || {};

  const update = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof name === "string" && name.length >= 1 && name.length <= 60) update.name = name;
  if (typeof about === "string" && about.length <= 500) update.about = about;
  if (Array.isArray(interests)) update.interests = interests.slice(0, 20);
  if (typeof serviceCity === "string" && serviceCity.length <= 80) update.serviceCity = serviceCity;
  if (serviceCityCoordinates && typeof serviceCityCoordinates.latitude === "number") {
    update.serviceCityCoordinates = serviceCityCoordinates;
  }

  await db.collection("users").doc(uid).set(update, { merge: true });
  return { success: true };
});

// ============================================================================
// updateUsername — uniqueness via /usernames/{handle}
// ============================================================================

export const updateUsername = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { username } = request.data || {};
  if (typeof username !== "string" || !/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error("invalid-argument: username must be 3-30 lowercase alphanumeric/underscore");
  }

  const newRef = db.collection("usernames").doc(username);
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(newRef);
    if (existing.exists && existing.data().userId !== uid) {
      throw new Error("already-exists: username taken");
    }
    const userDoc = await tx.get(userRef);
    const oldUsername = userDoc.exists ? userDoc.data().username : null;
    if (oldUsername && oldUsername !== username) {
      tx.delete(db.collection("usernames").doc(oldUsername));
    }
    tx.set(newRef, { userId: uid });
    tx.set(userRef, { username, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });

  return { success: true };
});

// ============================================================================
// getProfilePictureUploadUrl
// ============================================================================

export const getProfilePictureUploadUrl = onCall({
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const key = `${uid}/profilePicture.jpg`;

  const client = new S3Client({
    region: S3_REGION.value(),
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID.value(),
      secretAccessKey: AWS_SECRET_ACCESS_KEY.value(),
    },
  });

  const presigned = await createPresignedPost(client, {
    Bucket: S3_BUCKET.value(),
    Key: key,
    Conditions: [
      ["content-length-range", 0, 5 * 1024 * 1024], // 5MB
      ["starts-with", "$Content-Type", "image/"],
    ],
    Expires: 600,
  });

  return { success: true, uploadUrl: presigned.url, fields: presigned.fields, s3Key: key };
});
