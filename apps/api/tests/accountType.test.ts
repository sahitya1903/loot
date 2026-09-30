import express from 'express'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createLogger } from '../src/lib/logger.js'
import { requireAccountType, requireAuth } from '../src/middleware/auth.js'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { createTokenService } from '../src/modules/auth/tokens.js'
import { User } from '../src/modules/users/user.model.js'
import { startTestServer, testEnv } from './helpers.js'

let server: Awaited<ReturnType<typeof startTestServer>>
const tokens = createTokenService(testEnv)

// A stand-in for a professional-only route such as "create loot".
const app = express()
app.post('/loot', requireAuth(tokens), requireAccountType('professional'), (_req, res) => {
  res.status(201).json({ ok: true })
})
app.use(createErrorHandler(createLogger(testEnv)))

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

async function tokenFor(accountType: 'personal' | 'professional') {
  const user = await User.create({ phoneNumber: `+9190000000${accountType === 'personal' ? '01' : '02'}`, accountType })
  return tokens.signAccessToken(user._id.toString())
}

describe('requireAccountType', () => {
  it('blocks personal accounts from professional-only routes', async () => {
    const res = await request(app)
      .post('/loot')
      .set('Authorization', `Bearer ${await tokenFor('personal')}`)
      .expect(403)
    expect(res.body.error.code).toBe('account_type_required')
  })

  it('allows professional accounts', async () => {
    await request(app)
      .post('/loot')
      .set('Authorization', `Bearer ${await tokenFor('professional')}`)
      .expect(201)
  })

  it('applies an account-type change immediately, without a new token', async () => {
    const token = await tokenFor('personal')
    await User.updateOne({}, { accountType: 'professional' })
    await request(app).post('/loot').set('Authorization', `Bearer ${token}`).expect(201)
  })
})
