/**
 * Application configuration
 * Centralized configuration management - all environment variables are accessed here
 */

export const config = {
    app: {
        name: 'Assessment Portal',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        env: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
    },
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
        timeout: Number(process.env.API_TIMEOUT) || 30000, // 30 seconds default
    },
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assessment_engine',
        maxConnections: Number(process.env.DB_MAX_CONNECTIONS) || 20,
        connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT) || 2000,
        idleTimeout: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
    },
    mail: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || '"Assessment Portal" <noreply@assessmentportal.com>',
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
        tokenExpiry: process.env.JWT_EXPIRY || '1d',
    },
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY,
    }
};

export default config;
