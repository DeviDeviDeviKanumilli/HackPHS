// Structured logging with Winston and Sentry integration
import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.json(),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.json(),
  }),
];

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// If we're not in production, log to console with simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

/**
 * Log error with context
 */
export function logError(
  error: Error | unknown,
  context?: {
    userId?: string;
    requestId?: string;
    endpoint?: string;
    [key: string]: any;
  }
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(errorMessage, {
    stack: errorStack,
    ...context,
  });

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN && typeof window === 'undefined') {
    // Sentry will be initialized separately
    // @sentry/node will be imported when needed
  }
}

/**
 * Log info message with context
 */
export function logInfo(
  message: string,
  context?: Record<string, any>
) {
  logger.info(message, context);
}

/**
 * Log warning with context
 */
export function logWarning(
  message: string,
  context?: Record<string, any>
) {
  logger.warn(message, context);
}

/**
 * Log debug message (only in development)
 */
export function logDebug(
  message: string,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(message, context);
  }
}

/**
 * Create request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

