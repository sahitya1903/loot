import mongoose from 'mongoose'
import type { Logger } from './logger.js'

export async function connectMongo(uri: string, logger: Logger): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true)
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'))

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 })
  logger.info('MongoDB connected')
  return mongoose
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected
}
