/**
 * Structured Logger Utility
 *
 * Provides consistent, structured logging across the application.
 * In production, outputs JSON for easy parsing by log aggregators.
 * In development, outputs human-readable format.
 */

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production'

// Log level priority
const levelPriority = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Minimum log level from environment (default: 'info' in prod, 'debug' in dev)
const minLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

/**
 * Sanitize sensitive data from log context
 */
function sanitizeContext(context) {
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'creditCard',
    'ssn',
  ]

  const sanitized = {}

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some((sensitive) =>
      lowerKey.includes(sensitive.toLowerCase())
    )

    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry) {
  if (isProduction) {
    // JSON format for production (easy to parse by log aggregators)
    return JSON.stringify(entry)
  }

  // Human-readable format for development
  const timestamp = entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp
  const levelEmoji = {
    debug: '🔍',
    info: 'ℹ️ ',
    warn: '⚠️ ',
    error: '❌',
  }[entry.level]

  let output = `${timestamp} ${levelEmoji} ${entry.message}`

  if (entry.requestId) {
    output += ` [${entry.requestId}]`
  }

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`
  }

  return output
}

/**
 * Core logging function
 */
function log(level, message, context) {
  // Skip if below minimum level
  if (levelPriority[level] < levelPriority[minLevel]) {
    return
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? sanitizeContext(context) : undefined,
  }

  const formatted = formatLogEntry(entry)

  switch (level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

/**
 * Logger instance with all log levels
 */
export const logger = {
  debug: (message, context) => log('debug', message, context),
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context),
}

/**
 * Create a child logger with preset context
 */
export function createLogger(baseContext) {
  return {
    debug: (message, context) => log('debug', message, { ...baseContext, ...context }),
    info: (message, context) => log('info', message, { ...baseContext, ...context }),
    warn: (message, context) => log('warn', message, { ...baseContext, ...context }),
    error: (message, context) => log('error', message, { ...baseContext, ...context }),
  }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

export default logger
