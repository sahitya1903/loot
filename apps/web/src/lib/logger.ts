/**
 * Structured Logger Utility
 * 
 * Provides consistent, structured logging across the application.
 * In production, outputs JSON for easy parsing by log aggregators.
 * In development, outputs human-readable format.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    requestId?: string;
}

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Log level priority
const levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Minimum log level from environment (default: 'info' in prod, 'debug' in dev)
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug');

/**
 * Sanitize sensitive data from log context
 */
function sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = [
        'password',
        'token',
        'apiKey',
        'secret',
        'authorization',
        'cookie',
        'creditCard',
        'ssn',
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some((sensitive) =>
            lowerKey.includes(sensitive.toLowerCase())
        );

        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeContext(value as LogContext);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
    if (isProduction) {
        // JSON format for production (easy to parse by log aggregators)
        return JSON.stringify(entry);
    }

    // Human-readable format for development
    const timestamp = entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp;
    const levelEmoji = {
        debug: '🔍',
        info: 'ℹ️ ',
        warn: '⚠️ ',
        error: '❌',
    }[entry.level];

    let output = `${timestamp} ${levelEmoji} ${entry.message}`;

    if (entry.requestId) {
        output += ` [${entry.requestId}]`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
        output += ` ${JSON.stringify(entry.context)}`;
    }

    return output;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
    // Skip if below minimum level
    if (levelPriority[level] < levelPriority[minLevel]) {
        return;
    }

    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context: context ? sanitizeContext(context) : undefined,
    };

    const formatted = formatLogEntry(entry);

    switch (level) {
        case 'debug':
            console.debug(formatted);
            break;
        case 'info':
            console.info(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'error':
            console.error(formatted);
            break;
    }
}

/**
 * Logger instance with all log levels
 */
export const logger = {
    debug: (message: string, context?: LogContext) => log('debug', message, context),
    info: (message: string, context?: LogContext) => log('info', message, context),
    warn: (message: string, context?: LogContext) => log('warn', message, context),
    error: (message: string, context?: LogContext) => log('error', message, context),
};

/**
 * Create a child logger with preset context
 */
export function createLogger(baseContext: LogContext) {
    return {
        debug: (message: string, context?: LogContext) =>
            log('debug', message, { ...baseContext, ...context }),
        info: (message: string, context?: LogContext) =>
            log('info', message, { ...baseContext, ...context }),
        warn: (message: string, context?: LogContext) =>
            log('warn', message, { ...baseContext, ...context }),
        error: (message: string, context?: LogContext) =>
            log('error', message, { ...baseContext, ...context }),
    };
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export default logger;
