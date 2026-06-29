/**
 * Logging service
 * Suppresses console output in production
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

const minLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.NONE;

function formatMessage(context: string, message: string): string {
  return `[${new Date().toISOString()}] [${context}] ${message}`;
}

export const logger = {
  debug(context: string, message: string, ...data: unknown[]) {
    if (minLevel <= LogLevel.DEBUG) {
      console.debug(formatMessage(context, message), ...data);
    }
  },

  info(context: string, message: string, ...data: unknown[]) {
    if (minLevel <= LogLevel.INFO) {
      console.info(formatMessage(context, message), ...data);
    }
  },

  warn(context: string, message: string, ...data: unknown[]) {
    if (minLevel <= LogLevel.WARN) {
      console.warn(formatMessage(context, message), ...data);
    }
  },

  error(context: string, message: string, ...data: unknown[]) {
    if (minLevel <= LogLevel.ERROR) {
      console.error(formatMessage(context, message), ...data);
    }
  },
};
