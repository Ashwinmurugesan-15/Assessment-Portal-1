/**
 * Application configuration
 * Centralized configuration management - all environment variables are accessed here
 */

const isProduction = process.env.NODE_ENV === 'production';

// Helper to get required env var with validation
function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value && isProduction) {
        console.error(`[CONFIG ERROR] Missing required environment variable: ${key}`);
    }
    return value || '';
}

// Helper to get optional env var
function getOptionalEnvVar(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

// Helper to get numeric env var
function getNumericEnvVar(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

export const config = {
    app: {
        name: 'Assessment Portal',
        version: process.env.npm_package_version || '1.0.0',
        url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
        env: process.env.NODE_ENV || 'development',
        isProduction,
        isDevelopment: process.env.NODE_ENV === 'development',
        isTest: process.env.NODE_ENV === 'test',
    },
    api: {
        baseUrl: getOptionalEnvVar('NEXT_PUBLIC_API_URL', '/api'),
        timeout: getNumericEnvVar('API_TIMEOUT', 30000),
    },
    database: {
        url: getEnvVar('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/assessment_engine'),
        maxConnections: getNumericEnvVar('DB_MAX_CONNECTIONS', isProduction ? 50 : 20),
        connectionTimeout: getNumericEnvVar('DB_CONNECTION_TIMEOUT', 2000),
        idleTimeout: getNumericEnvVar('DB_IDLE_TIMEOUT', 30000),
    },
    mail: {
        host: getOptionalEnvVar('SMTP_HOST', 'smtp.gmail.com'),
        port: getNumericEnvVar('SMTP_PORT', 587),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: getOptionalEnvVar('SMTP_FROM', '"Assessment Portal" <noreply@assessmentportal.com>'),
    },
    auth: {
        jwtSecret: getEnvVar('JWT_SECRET', isProduction ? '' : 'default-dev-secret-change-in-production'),
        tokenExpiry: getOptionalEnvVar('JWT_EXPIRY', '1d'),
    },
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY,
    },
    logging: {
        level: getOptionalEnvVar('LOG_LEVEL', isProduction ? 'error' : 'debug'),
        enableConsole: process.env.DISABLE_CONSOLE_LOG !== 'true',
    },
    security: {
        rateLimitWindow: getNumericEnvVar('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
        rateLimitMax: getNumericEnvVar('RATE_LIMIT_MAX', isProduction ? 100 : 1000),
        bcryptRounds: getNumericEnvVar('BCRYPT_ROUNDS', 12),
    }
};

// Validate production configuration
if (isProduction) {
    const criticalMissing: string[] = [];

    if (!process.env.DATABASE_URL) criticalMissing.push('DATABASE_URL');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-secret-change-me') {
        criticalMissing.push('JWT_SECRET (must be a strong random secret)');
    }

    if (criticalMissing.length > 0) {
        console.error('╔════════════════════════════════════════════════════════════════╗');
        console.error('║  CRITICAL: Missing production environment variables!           ║');
        console.error('╠════════════════════════════════════════════════════════════════╣');
        criticalMissing.forEach(v => console.error(`║  • ${v.padEnd(58)}║`));
        console.error('╚════════════════════════════════════════════════════════════════╝');
    }

    // Warn about optional but recommended variables
    const warnings: string[] = [];
    if (!process.env.GEMINI_API_KEY) warnings.push('GEMINI_API_KEY - AI features will be disabled');
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) warnings.push('SMTP credentials - Email features will fail');

    if (warnings.length > 0) {
        console.warn('[CONFIG WARNINGS]');
        warnings.forEach(w => console.warn(`  ⚠ ${w}`));
    }
}

export default config;

