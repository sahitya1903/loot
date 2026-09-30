import { Schema, model } from 'mongoose'

// One pending OTP per phone number. Sending again replaces it.
const otpCodeSchema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    // HMAC of phone + code; the plain code is never stored.
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    // TTL index: MongoDB deletes the document after this time (within ~60s).
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { collection: 'otp_codes', timestamps: true },
)

export const OtpCode = model('OtpCode', otpCodeSchema)
