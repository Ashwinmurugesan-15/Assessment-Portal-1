import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from './config';

// Database connection pool
const pool = new Pool({
    connectionString: config.database.url,
    max: config.database.maxConnections,
    idleTimeoutMillis: config.database.idleTimeout,
    connectionTimeoutMillis: config.database.connectionTimeout,
});

// Set search_path for all connections to use assessment_schema
pool.on('connect', (client) => {
    client.query('SET search_path TO assessment_schema, public');
});

// Initialize database schema
export async function initializeDatabase() {
    const client = await pool.connect();
    try {
        const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        await client.query(schema);
        console.log('✅ Database schema initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Export the pool for use in db.ts
export default pool;
