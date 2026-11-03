// BullMQ runner for alert fan-out, so publishing a loot never waits on a big follower list.
//   drop-<lootId>      followers of the business (fanOutLootDrop)
//   ending-<lootId>    savers and code holders (fanOutEndingSoon)
//   receipts           delayed RECEIPT_DELAY_MS after a send; prunes tokens Expo couldn't deliver to

import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { PushToken } from './pushToken.model.js'
import { fanOutEndingSoon, fanOutLootDrop } from './fanout.js'

export const ALERTS_QUEUE = 'loot-alerts'
/** Expo keeps receipts for a day and usually has them within minutes. */
export const RECEIPT_DELAY_MS = 15 * 60_000

/** Alert hooks used when no queue is attached (tests, scripts). */
export const noopAlerts = {
  lootPublished() {},
  lootEndingSoon() {},
}

/**
 * Processes one job.
 * @param {{ name: string, data: object }} job
 * @param {{ push: object, redis?: import('ioredis').Redis, queueReceipts?: (tickets: object[]) => unknown }} deps
 */
export async function runAlertJob(job, { push, redis, queueReceipts = () => {} }) {
  if (job.name === 'receipts') {
    const { deadTokens } = await push.checkReceipts(job.data.tickets)
    if (deadTokens.length > 0) await PushToken.deleteMany({ token: { $in: deadTokens } })
    return { deadTokens: deadTokens.length }
  }
  const fanOut = { drop: fanOutLootDrop, 'ending-soon': fanOutEndingSoon }[job.name]
  if (!fanOut) throw new Error(`Unknown alert job: ${job.name}`)
  const { alerts, pushed, tickets } = await fanOut(job.data.lootId, { push, redis })
  if (tickets.length > 0) await queueReceipts(tickets)
  return { alerts, pushed }
}

/**
 * @param {object} deps
 * @param {string} deps.redisUrl BullMQ needs its own connection (blocking commands, no retry limit)
 * @param {import('ioredis').Redis} deps.redis shared client, for push cooldowns
 * @param {{ send: Function, checkReceipts: Function }} deps.push
 * @param {import('pino').Logger} deps.logger
 */
export function createAlertJobs({ redisUrl, redis, push, logger }) {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null })
  connection.on('error', (err) => logger.error({ err }, 'BullMQ Redis error'))
  const queue = new Queue(ALERTS_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: true,
      removeOnFail: { count: 1000 },
    },
  })
  let worker

  // Hooks are fire-and-forget: a Redis hiccup must not fail the request that triggered them.
  const enqueue = (name, loot, jobId) => {
    const lootId = loot._id.toString()
    queue
      .add(name, { lootId }, { jobId: `${jobId}-${lootId}` })
      .catch((err) => logger.warn({ err, lootId }, `Could not queue ${name} alerts`))
  }

  return {
    queue,

    /** A loot went live (created as active, or a draft was published). */
    lootPublished(loot) {
      enqueue('drop', loot, 'drop')
    },

    /** A loot entered `expiring`. */
    lootEndingSoon(loot) {
      enqueue('ending-soon', loot, 'ending')
    },

    async start() {
      const queueReceipts = (tickets) => queue.add('receipts', { tickets }, { delay: RECEIPT_DELAY_MS })
      worker = new Worker(ALERTS_QUEUE, (job) => runAlertJob(job, { push, redis, queueReceipts }), {
        connection,
        concurrency: 5,
      })
      worker.on('failed', (job, err) => logger.warn({ err, jobId: job?.id }, 'Alert job failed'))
      worker.on('error', (err) => logger.error({ err }, 'Alert worker error'))
      logger.info('Loot alert jobs started')
    },

    async close() {
      await worker?.close()
      await queue.close()
      await connection.quit().catch(() => {})
    },
  }
}
