/**
 * Production-ready Logger
 * Provides structured logging with different levels and environment-aware output
 */

import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    stack?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function shouldLog(level: LogLevel): boolean {
    const configLevel = config.logging.level as LogLevel;
    return LOG_LEVELS[level] >= LOG_LEVELS[configLevel];
}

function formatLogEntry(entry: LogEntry): string {
    if (config.app.isProduction) {
        // JSON format for production (easier to parse by log aggregators)
        return JSON.stringify(entry);
    }

    // Pretty format for development
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];

    let output = `${color}[${entry.level.toUpperCase()}]${reset} ${timestamp} - ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.stack) {
        output += `\n  Stack: ${entry.stack}`;
    }

    return output;
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        stack: error?.stack,
    };
}

export const logger = {
    debug(message: string, context?: LogContext): void {
        if (!shouldLog('debug') || !config.logging.enableConsole) return;
        console.debug(formatLogEntry(createLogEntry('debug', message, context)));
    },

    info(message: string, context?: LogContext): void {
        if (!shouldLog('info') || !config.logging.enableConsole) return;
        console.info(formatLogEntry(createLogEntry('info', message, context)));
    },

    warn(message: string, context?: LogContext): void {
        if (!shouldLog('warn') || !config.logging.enableConsole) return;
        console.warn(formatLogEntry(createLogEntry('warn', message, context)));
    },

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        if (!shouldLog('error') || !config.logging.enableConsole) return;
        const err = error instanceof Error ? error : undefined;
        const logContext = err ? { ...context, errorMessage: err.message } : context;
        console.error(formatLogEntry(createLogEntry('error', message, logContext, err)));
    },

    // Log API request/response for debugging
    request(method: string, path: string, context?: LogContext): void {
        this.info(`API Request: ${method} ${path}`, context);
    },

    response(method: string, path: string, status: number, duration: number): void {
        const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        const message = `API Response: ${method} ${path} - ${status} (${duration}ms)`;

        if (level === 'error') {
            this.error(message);
        } else if (level === 'warn') {
            this.warn(message);
        } else {
            this.info(message);
        }
    },

    // Database query logging
    query(query: string, duration: number): void {
        if (!config.app.isProduction) {
            this.debug(`DB Query (${duration}ms)`, {
                query: query.substring(0, 200) + (query.length > 200 ? '...' : '')
            });
        }
    },
};

export default logger;
