import { NextResponse } from 'next/server';
import pool from '@/lib/db-pool';
import { config } from '@/lib/config';

interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    checks: {
        database: 'healthy' | 'unhealthy' | 'unknown';
        application: 'healthy' | 'unhealthy';
        memory: 'healthy' | 'warning' | 'critical';
    };
    details?: {
        memoryUsage?: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            percentUsed: number;
        };
        databaseLatency?: number;
        aiService?: 'configured' | 'not_configured';
        emailService?: 'configured' | 'not_configured';
    };
}

/**
 * Health check endpoint
 * Returns comprehensive application and dependency health status
 * Used by load balancers, monitoring tools, and container orchestration
 */
export async function GET() {
    const startTime = Date.now();
    const memoryUsage = process.memoryUsage();
    const heapPercentUsed = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    const healthCheck: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: config.app.version,
        checks: {
            database: 'unknown',
            application: 'healthy',
            memory: heapPercentUsed > 90 ? 'critical' : heapPercentUsed > 70 ? 'warning' : 'healthy'
        },
        details: {
            memoryUsage: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                percentUsed: Math.round(heapPercentUsed)
            },
            aiService: config.ai.geminiApiKey ? 'configured' : 'not_configured',
            emailService: config.mail.user && config.mail.pass ? 'configured' : 'not_configured'
        }
    };

    // Check database connection
    try {
        const dbStart = Date.now();
        const result = await pool.query('SELECT NOW()');
        const dbLatency = Date.now() - dbStart;

        if (result.rows.length > 0) {
            healthCheck.checks.database = 'healthy';
            if (healthCheck.details) {
                healthCheck.details.databaseLatency = dbLatency;
            }
        }
    } catch (error) {
        healthCheck.status = 'unhealthy';
        healthCheck.checks.database = 'unhealthy';

        // Only log error details in non-production
        if (!config.app.isProduction) {
            console.error('Database health check failed:', error);
        }

        return NextResponse.json(healthCheck, { status: 503 });
    }

    // Check for memory issues
    if (healthCheck.checks.memory === 'critical') {
        healthCheck.status = 'degraded';
    }

    // Set appropriate status code based on overall health
    const statusCode = healthCheck.status === 'healthy' ? 200 :
        healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, {
        status: statusCode,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Response-Time': `${Date.now() - startTime}ms`
        }
    });
}

