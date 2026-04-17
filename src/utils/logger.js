import { LOG_LEVELS } from "../constants/appConstants";

/**
 * Application-wide logging utility
 * Provides centralized logging with different levels and formatting
 */

const isDevelopment = process.env.NODE_ENV === "development";

const LOG_COLORS = {
  [LOG_LEVELS.ERROR]: "#ff6b6b",
  [LOG_LEVELS.WARN]: "#ffa500",
  [LOG_LEVELS.INFO]: "#4dabf7",
  [LOG_LEVELS.DEBUG]: "#868e96",
};

class Logger {
  constructor() {
    this.enableLogging = isDevelopment;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      data,
    };
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    if (!this.enableLogging) return;

    const formatted = this.formatMessage(LOG_LEVELS.ERROR, message, error);
    console.error(
      `%c[ERROR] ${formatted.timestamp} - ${message}`,
      `color: ${LOG_COLORS[LOG_LEVELS.ERROR]}; font-weight: bold;`,
      error,
    );
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    if (!this.enableLogging) return;

    const formatted = this.formatMessage(LOG_LEVELS.WARN, message, data);
    console.warn(
      `%c[WARN] ${formatted.timestamp} - ${message}`,
      `color: ${LOG_COLORS[LOG_LEVELS.WARN]}; font-weight: bold;`,
      data,
    );
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    if (!this.enableLogging) return;

    const formatted = this.formatMessage(LOG_LEVELS.INFO, message, data);
    console.log(
      `%c[INFO] ${formatted.timestamp} - ${message}`,
      `color: ${LOG_COLORS[LOG_LEVELS.INFO]}; font-weight: bold;`,
      data,
    );
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (!this.enableLogging) return;

    const formatted = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
    console.debug(
      `%c[DEBUG] ${formatted.timestamp} - ${message}`,
      `color: ${LOG_COLORS[LOG_LEVELS.DEBUG]}; font-weight: bold;`,
      data,
    );
  }

  /**
   * Log performance metrics
   */
  performance(label, duration) {
    if (!this.enableLogging) return;

    console.time(label);
    console.log(
      `%c⏱️ ${label} took ${duration}ms`,
      "color: #5f748e; font-weight: bold;",
    );
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enableLogging = enabled;
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
