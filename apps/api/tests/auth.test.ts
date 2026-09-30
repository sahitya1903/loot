import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { OtpCode } from '../src/modules/auth/otp.model.js'
import { startTestServer } from './helpers.js'

type TestServer = Awaited<ReturnType<typeof startTestServer>>
let server: TestServer

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const PHONE = '+919876543210'

async function login(phoneNumber = PHONE) {
  await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber }).expect(200)
  const code = server.otpSender.codes.get(phoneNumber)
  const res = await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber, code }).expect(200)
  return res.body as {
    user: { userId: string; phoneNumber: string; accountType: string }
    isNewUser: boolean
    accessToken: string
    refreshToken: string
  }
}

function wrongCode(phoneNumber = PHONE) {
  const real = server.otpSender.codes.get(phoneNumber)
  return real === '000000' ? '111111' : '000000'
}

describe('health', () => {
  it('reports ok', async () => {
    await request(server.app).get('/health').expect(200, { status: 'ok' })
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(server.app).get('/nope').expect(404)
    expect(res.body.error.code).toBe('route_not_found')
  })
})

describe('OTP login', () => {
  it('rejects a malformed phone number', async () => {
    const res = await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: '98765' }).expect(400)
    expect(res.body.error.code).toBe('validation_failed')
  })

  it('normalises spaces and dashes in the phone number', async () => {
    await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: '+91 98765-43210' }).expect(200)
    expect(server.otpSender.codes.has(PHONE)).toBe(true)
  })

  it('never stores the plain code', async () => {
    await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: PHONE }).expect(200)
    const stored = await OtpCode.findOne({ phoneNumber: PHONE }).lean()
    expect(stored?.codeHash).toBeDefined()
    expect(JSON.stringify(stored)).not.toContain(server.otpSender.codes.get(PHONE))
  })

  it('creates a personal account on first login and reuses it after', async () => {
    const first = await login()
    expect(first.isNewUser).toBe(true)
    expect(first.user.phoneNumber).toBe(PHONE)
    expect(first.user.accountType).toBe('personal')

    const second = await login()
    expect(second.isNewUser).toBe(false)
    expect(second.user.userId).toBe(first.user.userId)
  })

  it('rejects a wrong code, and a code cannot be used twice', async () => {
    await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: PHONE }).expect(200)
    const code = server.otpSender.codes.get(PHONE)

    const wrong = await request(server.app)
      .post('/v1/auth/otp/verify')
      .send({ phoneNumber: PHONE, code: wrongCode() })
      .expect(400)
    expect(wrong.body.error.code).toBe('otp_invalid')

    await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber: PHONE, code }).expect(200)
    await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber: PHONE, code }).expect(400)
  })

  it('locks the code after 5 wrong attempts', async () => {
    await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: PHONE }).expect(200)
    const code = server.otpSender.codes.get(PHONE)

    for (let i = 0; i < 5; i++) {
      await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber: PHONE, code: wrongCode() }).expect(400)
    }
    const locked = await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber: PHONE, code }).expect(429)
    expect(locked.body.error.code).toBe('otp_attempts_exceeded')
    // The correct code no longer works either
    await request(server.app).post('/v1/auth/otp/verify').send({ phoneNumber: PHONE, code }).expect(400)
  })

  it('limits OTP sends to 3 per phone per window', async () => {
    for (let i = 0; i < 3; i++) {
      await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: PHONE }).expect(200)
    }
    const res = await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: PHONE }).expect(429)
    expect(res.body.error.code).toBe('rate_limited')
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0)
  })

  it('returns 502 and discards the code when delivery fails', async () => {
    server.otpSender.fail = true
    const res = await request(server.app).post('/v1/auth/otp/send').send({ phoneNumber: PHONE }).expect(502)
    expect(res.body.error.code).toBe('otp_delivery_failed')
    expect(await OtpCode.countDocuments({ phoneNumber: PHONE })).toBe(0)
  })
})

describe('access and refresh tokens', () => {
  it('GET /v1/me requires a valid access token', async () => {
    await request(server.app).get('/v1/me').expect(401)
    const bad = await request(server.app).get('/v1/me').set('Authorization', 'Bearer not-a-jwt').expect(401)
    expect(bad.body.error.code).toBe('invalid_token')

    const { accessToken, user } = await login()
    const me = await request(server.app).get('/v1/me').set('Authorization', `Bearer ${accessToken}`).expect(200)
    expect(me.body.user.userId).toBe(user.userId)
  })

  it('rotates refresh tokens and revokes the session when an old one is reused', async () => {
    const { refreshToken: original } = await login()

    const rotated = await request(server.app).post('/v1/auth/token/refresh').send({ refreshToken: original }).expect(200)
    const next = rotated.body.refreshToken as string
    expect(next).not.toBe(original)
    expect(rotated.body.accessToken).toBeTypeOf('string')

    // Replaying the old token is treated as theft: it fails, and so does the newest token.
    const reuse = await request(server.app).post('/v1/auth/token/refresh').send({ refreshToken: original }).expect(401)
    expect(reuse.body.error.code).toBe('refresh_token_reused')
    await request(server.app).post('/v1/auth/token/refresh').send({ refreshToken: next }).expect(401)
  })

  it('rejects an unknown refresh token', async () => {
    const res = await request(server.app).post('/v1/auth/token/refresh').send({ refreshToken: 'nope' }).expect(401)
    expect(res.body.error.code).toBe('invalid_refresh_token')
  })

  it('logout revokes the refresh token', async () => {
    const { refreshToken } = await login()
    await request(server.app).post('/v1/auth/logout').send({ refreshToken }).expect(204)
    await request(server.app).post('/v1/auth/token/refresh').send({ refreshToken }).expect(401)
  })
})
