export interface AuthContext {
  userId: string
}

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` once the access token is verified. */
      auth?: AuthContext
    }
  }
}
