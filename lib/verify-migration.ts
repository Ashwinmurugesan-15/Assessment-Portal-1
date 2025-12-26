import pool from './lib/db-pool.js';

async function verify() {
    try {
        const users = await pool.query('SELECT COUNT(*) FROM users');
        const assessments = await pool.query('SELECT COUNT(*) FROM assessments');
        const results = await pool.query('SELECT COUNT(*) FROM results');

        console.log('\n✅ Migration Verification:');
        console.log(`   Users: ${users.rows[0].count}`);
        console.log(`   Assessments: ${assessments.rows[0].count}`);
        console.log(`   Results: ${results.rows[0].count}`);
        console.log('\n✅ PostgreSQL migration successful!\n');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

verify();
