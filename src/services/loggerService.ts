import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export const LoggerService = {
    log: async (level: LogLevel, message: string, details?: any) => {
        const logEntry = {
            level,
            message,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Console log for development (or critical errors in prod)
        if (process.env.NODE_ENV === 'development' || level === 'error' || level === 'critical') {
            const color = {
                debug: '\x1b[90m', // Gray
                info: '\x1b[34m',
                warn: '\x1b[33m',
                error: '\x1b[31m',
                critical: '\x1b[41m'
            }[level];

            // Should not log debug in production even if logic falls through (double check env)
            if (level !== 'debug' || process.env.NODE_ENV === 'development') {
                console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, details || '');
            }
        }

        // Persist critical/error logs to Firestore
        if (level === 'error' || level === 'critical') {
            try {
                await addDoc(collection(db, 'system_logs'), logEntry);
            } catch (e) {
                console.error("Failed to persist log", e);
            }
        }
    },

    error: (message: string, error?: any) => LoggerService.log('error', message, {
        stack: error instanceof Error ? error.stack : null,
        message: error instanceof Error ? error.message : String(error)
    }),

    info: (message: string, details?: any) => LoggerService.log('info', message, details),
    warn: (message: string, details?: any) => LoggerService.log('warn', message, details),
    critical: (message: string, details?: any) => LoggerService.log('critical', message, details),
    debug: (message: string, details?: any) => LoggerService.log('debug', message, details)
};
