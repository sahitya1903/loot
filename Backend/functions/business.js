// Loot — business onboarding and management (pro-only).

import "./options.js";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { info, error as _error } from "firebase-functions/logger";
import { randomUUID } from "node:crypto";

import { requireProfessional, requireBusinessOwnership, getAccountType } from "./roles.js";

const db = getFirestore();

const VALID_BUSINESS_CATEGORIES = new Set([
  "cafe", "restaurant", "bar_club", "retail_store",
  "salon_spa", "gym_studio", "venue", "service_provider", "creator", "other",
]);

function geoHash(lat, lng, precision = 7) {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
  let bitsTotal = 0, hashIdx = 0, even = true;
  let out = "";
  while (out.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) { hashIdx = (hashIdx << 1) + 1; minLng = mid; }
      else { hashIdx <<= 1; maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) { hashIdx = (hashIdx << 1) + 1; minLat = mid; }
      else { hashIdx <<= 1; maxLat = mid; }
    }
    even = !even;
    if (++bitsTotal % 5 === 0) {
      out += BASE32[hashIdx];
      hashIdx = 0;
    }
  }
  return out;
}

// ============================================================================
// chooseAccountType — first call after signup; flips a personal user to pro
// ============================================================================

export const chooseAccountType = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { accountType } = request.data || {};
  if (!["personal", "professional"].includes(accountType)) {
    throw new Error("invalid-argument: accountType must be 'personal' or 'professional'");
  }

  const existing = await getAccountType(uid);
  if (existing && existing !== accountType) {
    throw new Error("failed-precondition: account type already set");
  }

  const userRef = db.collection("users").doc(uid);
  if (accountType === "personal") {
    await userRef.set({ accountType: "personal", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
  }

  // Pro path — create a paired business document with the same id as uid.
  const businessId = uid;
  const businessRef = db.collection("businesses").doc(businessId);
  await db.runTransaction(async (tx) => {
    const businessDoc = await tx.get(businessRef);
    if (!businessDoc.exists) {
      tx.set(businessRef, {
        businessId,
        ownerUserId: uid,
        businessName: "",
        username: "",
        category: "other",
        verified: false,
        branchLocations: [],
        followersCount: 0,
        lootCount: 0,
        totalClaimsCount: 0,
        analyticsEnabled: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.set(userRef, {
      accountType: "professional",
      businessId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { success: true, businessId };
});

// ============================================================================
// onboardBusiness — fill in business profile
// ============================================================================

export const onboardBusiness = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { businessName, username, category, about, branchLocations } = request.data || {};
  if (typeof businessName !== "string" || businessName.length < 2) {
    throw new Error("invalid-argument: businessName required");
  }
  if (typeof username !== "string" || !/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error("invalid-argument: username must be 3-30 lowercase alphanumeric/underscore");
  }
  if (!VALID_BUSINESS_CATEGORIES.has(category)) {
    throw new Error("invalid-argument: unknown category");
  }
  if (!Array.isArray(branchLocations) || branchLocations.length === 0) {
    throw new Error("invalid-argument: at least one branch location required");
  }

  const businessId = uid; // 1:1 pairing
  await requireBusinessOwnership(uid, businessId);

  // Username uniqueness — Firestore doesn't natively enforce this; reserve via /usernames/{handle}
  const usernameRef = db.collection("usernames").doc(username);
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists && existing.data().businessId !== businessId) {
      throw new Error("already-exists: username taken");
    }

    const branches = branchLocations.map(b => ({
      branchId: randomUUID(),
      name: String(b.name || "Main"),
      address: String(b.address || ""),
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
      geoHash: geoHash(Number(b.latitude), Number(b.longitude), 7),
      hours: b.hours || null,
      phone: b.phone || null,
    }));

    tx.set(usernameRef, { businessId });
    tx.update(db.collection("businesses").doc(businessId), {
      businessName,
      username,
      category,
      about: about || "",
      branchLocations: branches,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, businessId };
});

// ============================================================================
// updateBusiness
// ============================================================================

export const updateBusiness = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { businessName, about, category, logo, banner } = request.data || {};
  const businessId = uid;
  await requireBusinessOwnership(uid, businessId);

  const update = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof businessName === "string" && businessName.length >= 2) update.businessName = businessName;
  if (typeof about === "string" && about.length <= 500) update.about = about;
  if (VALID_BUSINESS_CATEGORIES.has(category)) update.category = category;
  if (typeof logo === "string") update.logo = logo;
  if (typeof banner === "string") update.banner = banner;

  await db.collection("businesses").doc(businessId).update(update);
  return { success: true };
});

// ============================================================================
// addBranch / removeBranch
// ============================================================================

export const addBranch = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { name, address, latitude, longitude, hours, phone } = request.data || {};
  if (!name || !address || typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("invalid-argument");
  }

  const businessId = uid;
  await requireBusinessOwnership(uid, businessId);

  const branch = {
    branchId: randomUUID(),
    name,
    address,
    latitude,
    longitude,
    geoHash: geoHash(latitude, longitude, 7),
    hours: hours || null,
    phone: phone || null,
  };

  await db.collection("businesses").doc(businessId).update({
    branchLocations: FieldValue.arrayUnion(branch),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { success: true, branch };
});

export const removeBranch = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { branchId } = request.data || {};
  if (!branchId) throw new Error("invalid-argument");

  const businessRef = db.collection("businesses").doc(uid);
  await requireBusinessOwnership(uid, uid);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(businessRef);
    if (!doc.exists) throw new Error("not-found");
    const data = doc.data();
    const remaining = (data.branchLocations || []).filter(b => b.branchId !== branchId);
    if (remaining.length === 0) {
      throw new Error("failed-precondition: cannot remove last branch");
    }
    tx.update(businessRef, {
      branchLocations: remaining,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});

// ============================================================================
// followBusiness / unfollowBusiness
// ============================================================================

export const followBusiness = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { businessId } = request.data || {};
  if (!businessId) throw new Error("invalid-argument");

  const followerRef = db.collection("businesses").doc(businessId).collection("followers").doc(uid);
  const userFollowingRef = db.collection("users").doc(uid).collection("following").doc(businessId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(followerRef);
    if (existing.exists) return;
    tx.set(followerRef, { followedAt: FieldValue.serverTimestamp() });
    tx.set(userFollowingRef, { followedAt: FieldValue.serverTimestamp() });
    tx.update(db.collection("businesses").doc(businessId), { followersCount: FieldValue.increment(1) });
    tx.update(db.collection("users").doc(uid), { followingCount: FieldValue.increment(1) });
  });
  return { success: true };
});

export const unfollowBusiness = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { businessId } = request.data || {};
  if (!businessId) throw new Error("invalid-argument");

  const followerRef = db.collection("businesses").doc(businessId).collection("followers").doc(uid);
  const userFollowingRef = db.collection("users").doc(uid).collection("following").doc(businessId);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(followerRef);
    if (!existing.exists) return;
    tx.delete(followerRef);
    tx.delete(userFollowingRef);
    tx.update(db.collection("businesses").doc(businessId), { followersCount: FieldValue.increment(-1) });
    tx.update(db.collection("users").doc(uid), { followingCount: FieldValue.increment(-1) });
  });
  return { success: true };
});

// ============================================================================
// getBusiness
// ============================================================================

export const getBusiness = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  const { businessId } = request.data || {};
  if (!businessId) throw new Error("invalid-argument");

  const [businessDoc, followingDoc] = await Promise.all([
    db.collection("businesses").doc(businessId).get(),
    db.collection("users").doc(uid).collection("following").doc(businessId).get(),
  ]);

  if (!businessDoc.exists) throw new Error("not-found");
  return {
    success: true,
    business: businessDoc.data(),
    isFollowing: followingDoc.exists,
  };
});

// ============================================================================
// submitVerification — pro requests "verified business" review
// ============================================================================

export const submitVerification = onCall({}, async (request) => {
  if (!request.auth?.uid) throw new Error("unauthenticated");
  const uid = request.auth.uid;
  await requireProfessional(uid);

  const { documentType, documentS3Key, notes } = request.data || {};
  if (!documentType || !documentS3Key) throw new Error("invalid-argument");

  await db.collection("businesses").doc(uid).collection("verification").add({
    documentType,
    documentS3Key,
    notes: notes || "",
    status: "submitted",
    submittedAt: FieldValue.serverTimestamp(),
  });

  info(`verification submitted by business ${uid}`);
  return { success: true, status: "submitted" };
});
