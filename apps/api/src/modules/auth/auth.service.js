import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { HttpError, badRequest, tooManyRequests, unauthorized } from '../../lib/errors.js'
import { User, toPublicUser } from '../users/user.model.js'
import { OtpCode } from './otp.model.js'
import { RefreshToken } from './refreshToken.model.js'
import { generateRefreshToken, hashToken } from './tokens.js'

const MAX_OTP_ATTEMPTS = 5
const DAY_MS = 24 * 60 * 60 * 1000

export function createAuthService({ env, logger, otpSender, tokens }) {
  function hashOtp(phoneNumber, code) {
    return createHmac('sha256', env.OTP_SECRET).update(`${phoneNumber}:${code}`).digest('hex')
  }

  function otpMatches(storedHash, phoneNumber, code) {
    const expected = Buffer.from(storedHash, 'hex')
    const actual = Buffer.from(hashOtp(phoneNumber, code), 'hex')
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  }

  async function issueTokens(userId, familyId = randomUUID()) {
    const refreshToken = generateRefreshToken()
    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      userId,
      familyId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    })
    return {
      accessToken: await tokens.signAccessToken(userId.toString()),
      accessTokenExpiresIn: tokens.accessTokenTtlSeconds,
      refreshToken,
    }
  }

  async function findOrCreateUser(phoneNumber) {
    const existing = await User.findOne({ phoneNumber })
    if (existing) return { user: existing, isNewUser: false }
    try {
      return { user: await User.create({ phoneNumber }), isNewUser: true }
    } catch (err) {
      // Two verifications raced to create the same user; use the winner's document.
      if (err.code === 11000) {
        const user = await User.findOne({ phoneNumber })
        if (user) return { user, isNewUser: false }
      }
      throw err
    }
  }

  return {
    async sendOtp(phoneNumber) {
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
      await OtpCode.findOneAndUpdate(
        { phoneNumber },
        {
          codeHash: hashOtp(phoneNumber, code),
          attempts: 0,
          expiresAt: new Date(Date.now() + env.OTP_TTL_SECONDS * 1000),
        },
        { upsert: true },
      )

      try {
        await otpSender.send(phoneNumber, code)
      } catch (err) {
        logger.error({ err }, 'OTP delivery failed')
        await OtpCode.deleteOne({ phoneNumber })
        throw new HttpError(502, 'otp_delivery_failed', 'Could not send the code, please try again')
      }

      return { expiresInSeconds: env.OTP_TTL_SECONDS }
    },

    async verifyOtp(phoneNumber, code) {
      const invalid = () => badRequest('otp_invalid', 'The code is incorrect or has expired')

      const otp = await OtpCode.findOne({ phoneNumber })
      // The TTL index deletes lazily, so check expiry explicitly.
      if (!otp || otp.expiresAt.getTime() <= Date.now()) throw invalid()

      if (otp.attempts >= MAX_OTP_ATTEMPTS) {
        await OtpCode.deleteOne({ _id: otp._id })
        throw tooManyRequests('otp_attempts_exceeded', 'Too many incorrect attempts, request a new code')
      }

      if (!otpMatches(otp.codeHash, phoneNumber, code)) {
        await OtpCode.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } })
        throw invalid()
      }

      // Consume atomically so the same code can't log in twice.
      const consumed = await OtpCode.findOneAndDelete({ _id: otp._id, codeHash: otp.codeHash })
      if (!consumed) throw invalid()

      const { user, isNewUser } = await findOrCreateUser(phoneNumber)
      return { user: toPublicUser(user), isNewUser, ...(await issueTokens(user._id)) }
    },

    async refresh(refreshToken) {
      const tokenHash = hashToken(refreshToken)
      const now = new Date()

      // Clients must not refresh in parallel: the second request would present a
      // just-rotated token and be treated as reuse, logging the user out.
      const current = await RefreshToken.findOneAndUpdate(
        { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
        { revokedAt: now },
      )

      if (!current) {
        const known = await RefreshToken.findOne({ tokenHash })
        if (known?.revokedAt) {
          await RefreshToken.updateMany({ familyId: known.familyId, revokedAt: null }, { revokedAt: now })
          logger.warn({ userId: known.userId.toString() }, 'Refresh token reuse detected; session revoked')
          throw unauthorized('refresh_token_reused', 'Session has been revoked, please log in again')
        }
        throw unauthorized('invalid_refresh_token', 'Refresh token is invalid or expired')
      }

      const userExists = await User.exists({ _id: current.userId })
      if (!userExists) throw unauthorized('user_not_found', 'Account no longer exists')

      return issueTokens(current.userId, current.familyId)
    },

    async logout(refreshToken) {
      const token = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) })
      if (!token) return
      await RefreshToken.updateMany({ familyId: token.familyId, revokedAt: null }, { revokedAt: new Date() })
    },
  }
}
