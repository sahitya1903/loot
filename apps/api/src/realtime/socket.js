// Socket.io: pushes live counters, new nearby loot and redemption updates. Rooms:
//   loot:<id>     everyone watching that loot (feed cards, details screen)
//   area:<cell>   viewers near that geoHash cell (see @loot/shared areaCellsAround)
//   user:<id>     one signed-in user's devices
// Everything pushed here can also be fetched over REST, so clients degrade to polling.

import { MAX_WATCHED_LOOT, REALTIME_EVENTS, areaCell, areaCellsAround, objectId } from '@loot/shared'
import { createAdapter } from '@socket.io/redis-adapter'
import { Server } from 'socket.io'
import { z } from 'zod'
import { toRedemption } from '../modules/engagement/claim.model.js'
import { toFeedItem, toLootCounters } from '../modules/loot/loot.serialize.js'

const LootIdsMessage = z.object({ lootIds: z.array(objectId).min(1).max(MAX_WATCHED_LOOT) })
const AreaMessage = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })

const lootRoom = (id) => `loot:${id}`
const areaRoom = (cell) => `area:${cell}`
const userRoom = (id) => `user:${id}`

function bearer(socket) {
  const fromAuth = socket.handshake.auth?.token
  if (typeof fromAuth === 'string' && fromAuth) return fromAuth.replace(/^Bearer /i, '')
  return socket.handshake.headers.authorization?.match(/^Bearer (.+)$/i)?.[1]
}

/**
 * Wraps a client → server handler: validates the payload and always acks
 * `{ ok: true }` or `{ ok: false, error: { code, message } }`.
 */
function handler(schema, run) {
  return (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {}
    const parsed = schema.safeParse(payload)
    if (!parsed.success) return reply({ ok: false, error: { code: 'validation_failed', message: 'Invalid payload' } })
    const error = run(parsed.data)
    reply(error ? { ok: false, error } : { ok: true })
  }
}

/**
 * @param {object} deps
 * @param {{ CORS_ORIGINS: string[] }} deps.env
 * @param {{ verifyAccessToken: (token: string) => Promise<{ userId: string }> }} deps.tokens
 * @param {import('pino').Logger} deps.logger
 * @param {import('ioredis').Redis} [deps.redis] enables the Redis adapter, so several API
 *   instances share rooms. Omit for a single process (tests).
 */
export function createSocketRealtime({ env, tokens, logger, redis }) {
  const io = new Server({
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    // Small messages only; a client never needs to send more.
    maxHttpBufferSize: 16 * 1024,
  })

  const adapterClients = redis ? [redis.duplicate(), redis.duplicate()] : []
  if (redis) io.adapter(createAdapter(...adapterClients))

  // Anonymous sockets are welcome (counters are public). A token that is present but
  // invalid is refused, so the client refreshes it instead of silently losing user events.
  io.use(async (socket, next) => {
    const token = bearer(socket)
    if (!token) return next()
    try {
      socket.data.userId = (await tokens.verifyAccessToken(token)).userId
      next()
    } catch {
      next(Object.assign(new Error('invalid_token'), { data: { code: 'invalid_token' } }))
    }
  })

  io.on('connection', (socket) => {
    if (socket.data.userId) socket.join(userRoom(socket.data.userId))
    const watched = () => [...socket.rooms].filter((room) => room.startsWith('loot:')).length

    socket.on(
      REALTIME_EVENTS.watchLoot,
      handler(LootIdsMessage, ({ lootIds }) => {
        const fresh = lootIds.filter((id) => !socket.rooms.has(lootRoom(id)))
        if (watched() + fresh.length > MAX_WATCHED_LOOT) {
          return { code: 'too_many_watched', message: `Watch at most ${MAX_WATCHED_LOOT} loot at once` }
        }
        socket.join(fresh.map(lootRoom))
      }),
    )

    socket.on(
      REALTIME_EVENTS.unwatchLoot,
      handler(LootIdsMessage, ({ lootIds }) => {
        for (const id of lootIds) socket.leave(lootRoom(id))
      }),
    )

    socket.on(
      REALTIME_EVENTS.watchArea,
      handler(AreaMessage, ({ latitude, longitude }) => {
        for (const room of socket.rooms) if (room.startsWith('area:')) socket.leave(room)
        socket.join(areaCellsAround(latitude, longitude).map(areaRoom))
      }),
    )
  })

  return {
    io,

    /** Counters changed (save, claim, edit, archive, expiry). */
    lootCounters(loot) {
      io.to(lootRoom(loot._id.toString())).emit(REALTIME_EVENTS.lootCounters, toLootCounters(loot))
    },

    /** A loot just went live. */
    lootPublished(loot, business) {
      const [longitude, latitude] = loot.location.coordinates
      io.to(areaRoom(areaCell(latitude, longitude))).emit(REALTIME_EVENTS.lootPublished, toFeedItem(loot, business))
    },

    /** A business redeemed this claim. */
    redemptionUpdated(claim) {
      io.to(userRoom(claim.userId.toString())).emit(REALTIME_EVENTS.redemptionUpdated, {
        redemption: toRedemption(claim),
      })
    },

    async close() {
      await new Promise((resolve) => io.close(() => resolve()))
      await Promise.allSettled(adapterClients.map((client) => client.quit()))
      logger.debug('Socket.io closed')
    },
  }
}
