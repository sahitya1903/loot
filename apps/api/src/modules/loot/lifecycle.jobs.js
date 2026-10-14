// BullMQ runner for loot lifecycle transitions (see lifecycle.js for the transitions).
//   expiring-<lootId>-<expiryMs>  delayed until ENDING_SOON_MS before expiryAt
//   expire-<lootId>-<expiryMs>    delayed until expiryAt
//   sweep                         every minute; catches anything the delayed jobs missed
// Job ids include the expiry, so editing expiryAt schedules new jobs; the old ones still
// run but change nothing, because every handler re-checks expiryAt against the clock.

import { ENDING_SOON_MS } from '@loot/shared'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { expireLoot, markLootExpiring, sweepLootLifecycle } from './lifecycle.js'

export const LIFECYCLE_QUEUE = 'loot-lifecycle'
export const SWEEP_EVERY_MS = 60_000

/** The delayed jobs for one live loot. */
export function lifecycleJobsFor(loot, now = Date.now()) {
  const lootId = loot._id.toString()
  const expiryMs = loot.expiryAt.getTime()
  const warnAt = expiryMs - ENDING_SOON_MS
  const jobs = []
  if (warnAt > now) {
    jobs.push({
      name: 'expiring',
      data: { lootId },
      opts: { jobId: `expiring-${lootId}-${expiryMs}`, delay: warnAt - now },
    })
  }
  jobs.push({
    name: 'expire',
    data: { lootId },
    opts: { jobId: `expire-${lootId}-${expiryMs}`, delay: Math.max(0, expiryMs - now) },
  })
  return jobs
}

/** Processes one job and pushes changed counters to watchers. */
export async function runLifecycleJob(job, { realtime }) {
  if (job.name === 'sweep') {
    const { expired, expiring } = await sweepLootLifecycle()
    for (const loot of [...expired, ...expiring]) realtime.lootCounters(loot)
    return { expired: expired.length, expiring: expiring.length }
  }
  const transition = { expire: expireLoot, expiring: markLootExpiring }[job.name]
  if (!transition) throw new Error(`Unknown lifecycle job: ${job.name}`)
  const changed = await transition(job.data.lootId)
  if (changed) realtime.lootCounters(changed)
  return { changed: Boolean(changed) }
}

/**
 * @param {object} deps
 * @param {string} deps.redisUrl BullMQ needs its own connection (blocking commands, no retry limit)
 * @param {{ lootCounters: Function }} deps.realtime
 * @param {import('pino').Logger} deps.logger
 * @param {number} [deps.sweepEveryMs]
 */
export function createLifecycleJobs({ redisUrl, realtime, logger, sweepEveryMs = SWEEP_EVERY_MS }) {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null })
  connection.on('error', (err) => logger.error({ err }, 'BullMQ Redis error'))
  const queue = new Queue(LIFECYCLE_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: { count: 1000 },
    },
  })
  let worker

  return {
    queue,

    /** Called when a loot goes live or its expiry changes. */
    async scheduleLoot(loot) {
      await queue.addBulk(lifecycleJobsFor(loot))
    },

    /** Starts processing in this process and registers the sweeper (idempotent across instances). */
    async start() {
      worker = new Worker(LIFECYCLE_QUEUE, (job) => runLifecycleJob(job, { realtime }), { connection, concurrency: 10 })
      worker.on('failed', (job, err) => logger.warn({ err, jobId: job?.id }, 'Lifecycle job failed'))
      worker.on('error', (err) => logger.error({ err }, 'Lifecycle worker error'))
      await queue.upsertJobScheduler('sweep', { every: sweepEveryMs }, { name: 'sweep' })
      // Catch up right away on anything that expired while the API was down.
      await queue.add('sweep', {})
      logger.info('Loot lifecycle jobs started')
    },

    async close() {
      await worker?.close()
      await queue.close()
      await connection.quit().catch(() => {})
    },
  }
}
