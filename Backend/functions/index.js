// Loot — Cloud Functions root.
//
// Re-exports every callable / trigger / scheduled function from the per-domain
// modules. options.js is imported first so the global region (asia-south1) is
// set before any handler is registered.
//
// Also hosts a few small infrastructure callables that don't fit a domain
// module: geocodeLatLng, deleteProfilePicture.

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { error as _error, info } from "firebase-functions/logger";
import axios from "axios";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { defineString, defineSecret } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";

const GEOCODING_API_KEY = defineSecret("GEOCODING_API_KEY");
const S3_BUCKET = defineString("S3_BUCKET");
const S3_REGION = defineString("S3_REGION");
const AWS_ACCESS_KEY_ID = defineSecret("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = defineSecret("AWS_SECRET_ACCESS_KEY");

const db = getFirestore();

// ============================================================================
// Tiny utility callables
// ============================================================================

export const geocodeLatLng = onCall({
  secrets: ["GEOCODING_API_KEY"],
}, async (request) => {
  const { lat, lng } = request.data || {};
  const apiKey = GEOCODING_API_KEY.value();
  if (typeof lat !== "number" || typeof lng !== "number" || !apiKey) {
    throw new Error("invalid-argument: lat/lng required");
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const response = await axios.get(url);
  if (response.data.status === "OK" && response.data.results.length > 0) {
    return { address: response.data.results[0].formatted_address };
  }
  throw new Error("not-found: no address for those coordinates");
});

export const deleteProfilePicture = onCall({
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const userId = request.auth.uid;
  const key = `${userId}/profilePicture.jpg`;

  const s3Client = new S3Client({
    region: S3_REGION.value(),
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID.value(),
      secretAccessKey: AWS_SECRET_ACCESS_KEY.value(),
    },
  });

  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET.value(), Key: key }));
  await db.collection("users").doc(userId).update({ profilePicture: "" });
  info(`profile picture deleted for ${userId}`);
  return { success: true };
});

// ============================================================================
// Loot domain
// ============================================================================

export {
  createLoot,
  attachLootMedia,
  updateLoot,
  archiveLoot,
  getLoot,
  getLootMediaUrls,
  trackLootView,
} from "./loot.js";

export {
  claimLoot,
  saveLoot,
  unsaveLoot,
  shareLoot,
  getRedemption,
  getRedemptionByLoot,
  reviewLoot,
} from "./claim.js";

export {
  fanoutLootToFollowers,
  fanoutLootOnPublish,
  backfillFollowFeed,
  getFollowingFeed,
  getFreshFeed,
  getTrendingFeed,
  getBusinessLoot,
} from "./feed.js";

export {
  getNearbyLoot,
  onLootWrittenForNearby,
  reconcileNearbyLoot,
} from "./nearbyLoot.js";

export {
  recomputeTrendingScore,
  getLocalityTrend,
} from "./discovery.js";

export {
  advanceLifecycle,
  recomputeBusinessLootCount,
} from "./expiry.js";

export {
  onFollowerFeedItemAdded,
} from "./loot_alert.js";

// ============================================================================
// Business / accounts
// ============================================================================

export {
  chooseAccountType,
  onboardBusiness,
  updateBusiness,
  addBranch,
  removeBranch,
  followBusiness,
  unfollowBusiness,
  getBusiness,
  submitVerification,
} from "./business.js";

// ============================================================================
// Pro: boost + analytics
// ============================================================================

export {
  createBoost,
  expireBoosts,
} from "./boost.js";

export {
  getLootAnalytics,
  getBusinessAnalytics,
} from "./analytics.js";

// ============================================================================
// Counters
// ============================================================================

export {
  onUserSavedLootCreated,
  onUserSavedLootDeleted,
  onUserClaimedLootCreated,
  onLootClaimCreated,
} from "./counters.js";

// ============================================================================
// Infrastructure (carried over from prior product)
// ============================================================================

// Auth
export {
  sendWhatsappOtp,
  verifyWhatsappOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from "./login.js";

// Profile
export {
  onUserCreated,
  updateProfile,
  updateUsername,
  getProfilePictureUploadUrl,
} from "./profile.js";

// Reports / moderation
export {
  reportLoot,
  reportBusiness,
} from "./reports.js";

// Razorpay (pro subscription + boost webhook)
export {
  razorpayWebhook,
  getProSubscriptionPlans,
  createProSubscription,
  cancelProSubscription,
  getProSubscriptionStatus,
} from "./razorpay.js";

// FCM token registration + alert log
export {
  registerFcmToken,
  unregisterFcmToken,
  markAlertRead,
  listMyAlerts,
} from "./notifications.js";

// Cascade deletion triggers
export {
  onUserDeleted,
  onLootDeleted,
  onBusinessDeleted,
} from "./safeDeletes.js";
