import mongoose from 'mongoose'

export async function connectMongo(uri, logger) {
  mongoose.set('strictQuery', true)
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'))

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 })
  logger.info('MongoDB connected')
  return mongoose
}

export function isMongoReady() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected
}
