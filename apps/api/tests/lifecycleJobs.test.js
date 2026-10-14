import { ENDING_SOON_MS } from '@loot/shared'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createLifecycleJobs, lifecycleJobsFor, runLifecycleJob } from '../src/modules/loot/lifecycle.jobs.js'
import { Loot } from '../src/modules/loot/loot.model.js'
import { createCapturingRealtime, createLoot, signInBusiness, startTestServer } from './helpers.js'

let server

beforeAll(async () => {
  server = await startTestServer()
})
beforeEach(() => server.reset())
afterAll(() => server.stop())

const HOUR = 3600_000

describe('lifecycleJobsFor', () => {
  const now = Date.parse('2026-10-15T10:00:00Z')
  const loot = (expiresInMs) => ({ _id: { toString: () => 'abc123' }, expiryAt: new Date(now + expiresInMs) })

  it('schedules ending-soon and expiry at the exact moments', () => {
    const expiryMs = now + 6 * HOUR
    expect(lifecycleJobsFor(loot(6 * HOUR), now)).toEqual([
      {
        name: 'expiring',
        data: { lootId: 'abc123' },
        opts: { jobId: `expiring-abc123-${expiryMs}`, delay: 6 * HOUR - ENDING_SOON_MS },
      },
      { name: 'expire', data: { lootId: 'abc123' }, opts: { jobId: `expire-abc123-${expiryMs}`, delay: 6 * HOUR } },
    ])
  })

  it('skips the ending-soon job inside the window and never uses a negative delay', () => {
    expect(lifecycleJobsFor(loot(HOUR), now).map((j) => j.name)).toEqual(['expire'])
    expect(lifecycleJobsFor(loot(-1000), now)).toMatchObject([{ name: 'expire', opts: { delay: 0 } }])
  })

  it('uses ids BullMQ accepts (no colons)', () => {
    for (const job of lifecycleJobsFor(loot(6 * HOUR), now)) expect(job.opts.jobId).not.toContain(':')
  })
})

describe('runLifecycleJob', () => {
  it('expires due loot and pushes the new status', async () => {
    const realtime = createCapturingRealtime()
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)

    // Early (e.g. expiry was extended after scheduling): nothing changes.
    expect(await runLifecycleJob({ name: 'expire', data: { lootId: loot.id } }, { realtime })).toEqual({
      changed: false,
    })
    expect(realtime.events).toEqual([])

    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() - 1000) })
    expect(await runLifecycleJob({ name: 'expire', data: { lootId: loot.id } }, { realtime })).toEqual({
      changed: true,
    })
    expect(realtime.events).toEqual([{ type: 'counters', lootId: loot.id, claimCount: 0, status: 'expired' }])
  })

  it('marks loot as ending soon', async () => {
    const realtime = createCapturingRealtime()
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() + HOUR) })
    await runLifecycleJob({ name: 'expiring', data: { lootId: loot.id } }, { realtime })
    expect((await Loot.findById(loot.id).lean()).status).toBe('expiring')
  })

  it('sweeps and reports', async () => {
    const realtime = createCapturingRealtime()
    const biz = await signInBusiness(server)
    const loot = await createLoot(server, biz)
    await Loot.updateOne({ _id: loot.id }, { expiryAt: new Date(Date.now() - 1000) })
    expect(await runLifecycleJob({ name: 'sweep', data: {} }, { realtime })).toEqual({ expired: 1, expiring: 0 })
    expect(realtime.events).toHaveLength(1)
  })

  it('fails loudly on unknown jobs', async () => {
    await expect(
      runLifecycleJob({ name: 'mystery', data: {} }, { realtime: createCapturingRealtime() }),
    ).rejects.toThrow('Unknown lifecycle job')
  })
})

// Real BullMQ against a real Redis. Opt in with e.g. TEST_REDIS_URL=redis://localhost:6379/15
// (use a spare database: the queue is obliterated first).
describe.runIf(process.env.TEST_REDIS_URL)('BullMQ delayed jobs (real Redis)', () => {
  it('expires loot at its expiry time', async () => {
    const realtime = createCapturingRealtime()
    const logger = { info() {}, warn() {}, error() {}, debug() {} }
    const jobs = createLifecycleJobs({ redisUrl: process.env.TEST_REDIS_URL, realtime, logger })
    try {
      await jobs.queue.obliterate({ force: true })
      await jobs.start()
      const biz = await signInBusiness(server)
      const created = await createLoot(server, biz)
      const loot = await Loot.findByIdAndUpdate(
        created.id,
        { expiryAt: new Date(Date.now() + 1500) },
        { returnDocument: 'after' },
      )
      await jobs.scheduleLoot(loot)

      const deadline = Date.now() + 10_000
      let status
      while (Date.now() < deadline) {
        status = (await Loot.findById(loot._id).lean()).status
        if (status === 'expired') break
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
      expect(status).toBe('expired')
      expect(realtime.events).toContainEqual(expect.objectContaining({ lootId: created.id, status: 'expired' }))
    } finally {
      await jobs.queue.obliterate({ force: true }).catch(() => {})
      await jobs.close()
    }
  })
})
