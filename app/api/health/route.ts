import { NextResponse } from 'next/server';
import pool from '@/lib/db-pool';

/**
 * Health check endpoint
 * Returns application and database health status
 */
export async function GET() {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        checks: {
            database: 'unknown',
            application: 'healthy'
        }
    };

    try {
        // Check database connection
        const result = await pool.query('SELECT NOW()');
        if (result.rows.length > 0) {
            healthCheck.checks.database = 'healthy';
        }
    } catch (error) {
        healthCheck.status = 'unhealthy';
        healthCheck.checks.database = 'unhealthy';
        console.error('Database health check failed:', error);

        return NextResponse.json(healthCheck, { status: 503 });
    }

    return NextResponse.json(healthCheck, { status: 200 });
}
