import { initializeDatabase } from './db-pool';

async function main() {
    try {
        console.log('🔄 Initializing database schema...');
        await initializeDatabase();
        console.log('✅ Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

main();
