import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'

const ALGORITHM = 'HS256'
const AUDIENCE = 'loot-app'

export function createTokenService(env) {
  const key = new TextEncoder().encode(env.JWT_ACCESS_SECRET)

  return {
    accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,

    signAccessToken(userId) {
      return new SignJWT({})
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(userId)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
        .sign(key)
    },

    async verifyAccessToken(token) {
      const { payload } = await jwtVerify(token, key, {
        algorithms: [ALGORITHM],
        issuer: env.JWT_ISSUER,
        audience: AUDIENCE,
      })
      if (!payload.sub) throw new Error('Token has no subject')
      return { userId: payload.sub }
    },
  }
}

export function generateRefreshToken() {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
