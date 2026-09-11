// imports
import "./options.js";
import {onCall} from "firebase-functions/v2/https";
import {error as _error, info} from "firebase-functions/logger";
import {defineString, defineSecret} from "firebase-functions/params";
import axios from "axios";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {initializeApp} from "firebase-admin/app";


// parameters
const WHATSAPP_PHONE_NUMBER_ID = defineString("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_ACCESS_KEY = defineSecret("WHATSAPP_ACCESS_KEY");
const SES_FROM_EMAIL = defineString("SES_FROM_EMAIL");
const S3_REGION = defineString("S3_REGION");
const AWS_ACCESS_KEY_ID = defineSecret("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = defineSecret("AWS_SECRET_ACCESS_KEY");

initializeApp();
// initialize Firestore
const _auth = getAuth();
const db = getFirestore();

export const sendWhatsappOtp = onCall({
  secrets: ["WHATSAPP_ACCESS_KEY"],
  region: "asia-south1",
}, async (request) => {
  const {phoneNumber: rawPhone} = request.data;
  if (!rawPhone) {
    _error("Missing phoneNumber");
    throw new Error("invalid-argument: Missing phoneNumber");
  }
  const phoneNumber = rawPhone.trim();
  try {
    if (phoneNumber === "+11234567890") {
      // for testing purposes, we can skip sending the OTP
      const otp = "826209"; // example OTP
      // save the otp and number in Firestore
      await db.collection("otp").doc(phoneNumber).set({
        "otp": otp,
        "createdAt": FieldValue.serverTimestamp(),
      });
      return {success: true};
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const accessToken = WHATSAPP_ACCESS_KEY.value();
    const phoneId = WHATSAPP_PHONE_NUMBER_ID.value();
    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: "send_otp",
        language: {code: "en_US"},
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
      },
    };

    const url = `https://graph.facebook.com/v23.0/${phoneId}/messages`;

    await axios.post(url, payload, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    // save the otp and number in Firestore
    await db.collection("otp").doc(phoneNumber).set({
      "otp": otp,
      "createdAt": FieldValue.serverTimestamp(),
    });
    return {success: true};
  } catch (error) {
    _error("Error sending WhatsApp message", error);
    return {success: false, errorMessage: error.message};
  }
});

export const verifyWhatsappOtp = onCall({
  region: "asia-south1",
}, async (request) => {
  const {phoneNumber: rawPhone, otp} = request.data;
  if (!rawPhone || !otp) {
    _error("Missing phoneNumber or otp");
    throw new Error("invalid-argument: Missing phoneNumber or otp");
  }
  const phoneNumber = rawPhone.trim();
  try {
    const doc = await db.collection("otp").doc(phoneNumber).get();
    if (!doc.exists) {
      throw new Error("not-found: OTP not found for this phone number");
    }
    const data = doc.data();
    if (data.otp !== otp) {
      console.warn("Invalid OTP provided", {phoneNumber, otp});
      return {
        success: false,
        errorMessage: "permission-denied: Invalid OTP provided",
      };
    }
    // check if the OTP is expired
    const createdAt = data.createdAt ? data.createdAt.toDate() : null;
    if (!createdAt || (Date.now() - createdAt.getTime()) > 10 * 60 * 1000) {
      throw new Error("permission-denied: OTP has expired");
    }
    // OTP is valid, delete it from Firestore
    await db.collection("otp").doc(phoneNumber).delete();
    // check if the user exists, if not create a new user
    let userRecord;
    try {
      userRecord = await _auth.getUserByPhoneNumber(phoneNumber);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        userRecord = await _auth.createUser({phoneNumber});
      } else {
        throw err;
      }
    }
    const uid = userRecord.uid;
    const customToken = await _auth.createCustomToken(uid);
    return {success: true, token: customToken};
  } catch (error) {
    _error("Error verifying WhatsApp OTP", error);
    return {success: false, errorMessage: error.message};
  }
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendEmailOtp = onCall({
  secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  region: "asia-south1",
}, async (request) => {
  const {email} = request.data;
  if (!email || !EMAIL_REGEX.test(email)) {
    _error("Missing or invalid email");
    throw new Error("invalid-argument: Missing or invalid email");
  }
  try {
    const trimmedEmail = email.trim().toLowerCase();

    // Test bypass — only in non-production environments
    if (trimmedEmail === "test@momentomemories.com" && process.env.GCLOUD_PROJECT !== "momento-b7d02") {
      await db.collection("otp").doc(trimmedEmail).set({
        "otp": "826209",
        "createdAt": FieldValue.serverTimestamp(),
      });
      return {success: true};
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    await db.collection("otp").doc(trimmedEmail).set({
      "otp": otp,
      "createdAt": FieldValue.serverTimestamp(),
    });

    // Send via SES
    const {SESv2Client, SendEmailCommand} = await import("@aws-sdk/client-sesv2");
    const sesClient = new SESv2Client({
      region: S3_REGION.value(),
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID.value(),
        secretAccessKey: AWS_SECRET_ACCESS_KEY.value(),
      },
    });

    const command = new SendEmailCommand({
      FromEmailAddress: SES_FROM_EMAIL.value(),
      Destination: {ToAddresses: [trimmedEmail]},
      Content: {
        Simple: {
          Subject: {Data: "Your Momento verification code", Charset: "UTF-8"},
          Body: {
            Html: {
              Data: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                  <h2 style="color: #1a1a1a; margin-bottom: 8px;">Momento</h2>
                  <p style="color: #555; font-size: 16px;">Your verification code is:</p>
                  <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
                  </div>
                  <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
              `,
              Charset: "UTF-8",
            },
          },
        },
      },
    });
    await sesClient.send(command);

    info("Email OTP sent successfully");
    return {success: true};
  } catch (error) {
    _error("Error sending email OTP", error);
    return {success: false, errorMessage: error.message};
  }
});

export const verifyEmailOtp = onCall({
  region: "asia-south1",
}, async (request) => {
  const {email, otpCode, otp: legacyOtp} = request.data;
  const otp = otpCode ?? legacyOtp;
  if (!email || !otp) {
    _error("Missing email or otpCode");
    throw new Error("invalid-argument: Missing email or otpCode");
  }
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const doc = await db.collection("otp").doc(trimmedEmail).get();
    if (!doc.exists) {
      throw new Error("not-found: OTP not found for this email");
    }
    const data = doc.data();
    if (data.otp !== otp) {
      console.warn("Invalid OTP provided", {email: trimmedEmail});
      return {
        success: false,
        errorMessage: "permission-denied: Invalid OTP provided",
      };
    }
    // Check expiry (10 minutes)
    const createdAt = data.createdAt ? data.createdAt.toDate() : null;
    if (!createdAt || (Date.now() - createdAt.getTime()) > 10 * 60 * 1000) {
      throw new Error("permission-denied: OTP has expired");
    }
    // Delete OTP
    await db.collection("otp").doc(trimmedEmail).delete();
    // Find or create user
    let userRecord;
    try {
      userRecord = await _auth.getUserByEmail(trimmedEmail);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        userRecord = await _auth.createUser({email: trimmedEmail});
      } else {
        throw err;
      }
    }
    const uid = userRecord.uid;
    const customToken = await _auth.createCustomToken(uid);
    return {success: true, token: customToken};
  } catch (error) {
    _error("Error verifying email OTP", error);
    return {success: false, errorMessage: error.message};
  }
});
