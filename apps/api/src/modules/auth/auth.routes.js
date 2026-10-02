import { Router } from 'express'
import { z } from 'zod'
import { rateLimit } from '../../middleware/rateLimit.js'
import { validateBody } from '../../middleware/validate.js'

// E.164, e.g. +919876543210. Spaces and dashes are stripped first.
const phoneNumber = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Must be an international number like +919876543210'))

export const SendOtpBody = z.object({ phoneNumber })
export const VerifyOtpBody = z.object({ phoneNumber, code: z.string().regex(/^\d{6}$/, 'Must be 6 digits') })
export const RefreshTokenBody = z.object({ refreshToken: z.string().min(1) })

export function createAuthRouter(auth, redis) {
  const router = Router()

  router.post(
    '/otp/send',
    validateBody(SendOtpBody),
    rateLimit(redis, { name: 'otp-send-ip', limit: 20, windowSeconds: 60 * 60, key: (req) => req.ip }),
    rateLimit(redis, { name: 'otp-send-phone', limit: 3, windowSeconds: 10 * 60, key: (req) => req.body.phoneNumber }),
    async (req, res) => {
      res.json(await auth.sendOtp(req.body.phoneNumber))
    },
  )

  router.post(
    '/otp/verify',
    validateBody(VerifyOtpBody),
    rateLimit(redis, { name: 'otp-verify-ip', limit: 60, windowSeconds: 60 * 60, key: (req) => req.ip }),
    async (req, res) => {
      res.json(await auth.verifyOtp(req.body.phoneNumber, req.body.code))
    },
  )

  router.post('/token/refresh', validateBody(RefreshTokenBody), async (req, res) => {
    res.json(await auth.refresh(req.body.refreshToken))
  })

  router.post('/logout', validateBody(RefreshTokenBody), async (req, res) => {
    await auth.logout(req.body.refreshToken)
    res.status(204).end()
  })

  return router
}
