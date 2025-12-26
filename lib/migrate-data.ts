import fs from 'fs';
import path from 'path';
import pool from './db-pool';
import { initializeDatabase } from './db-pool';

const DATA_DIR = path.join(process.cwd(), 'data');
const ASSESSMENTS_FILE = path.join(DATA_DIR, 'assessments.json');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'candidate' | 'examiner' | 'admin';
    created_at: string;
    is_first_login?: boolean;
    assigned_assessments?: string[];
    created_assessments?: string[];
}

interface Assessment {
    assessment_id: string;
    title: string;
    description?: string;
    difficulty?: string;
    questions: any[];
    created_by: string;
    created_at: string;
    scheduled_for?: string;
    scheduled_from?: string;
    scheduled_to?: string;
    duration_minutes?: number;
    assigned_to: string[];
    retake_permissions?: string[];
}

interface Result {
    assessment_id: string;
    user_id: string;
    result: any;
    timestamp: string;
}

function readJsonFile<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error);
        return [];
    }
}

async function migrateUsers(users: User[]) {
    console.log(`\n📊 Migrating ${users.length} users...`);
    let migrated = 0;

    for (const user of users) {
        try {
            const query = `
                INSERT INTO users (id, name, email, password, role, created_at, is_first_login, assigned_assessments, created_assessments)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
            `;
            const values = [
                user.id,
                user.name,
                user.email,
                user.password,
                user.role,
                user.created_at,
                user.is_first_login ?? true,
                user.assigned_assessments || null,
                user.created_assessments || null
            ];
            await pool.query(query, values);
            migrated++;
        } catch (error) {
            console.error(`❌ Error migrating user ${user.email}:`, error);
        }
    }

    console.log(`✅ Migrated ${migrated}/${users.length} users`);
}

async function migrateAssessments(assessments: Assessment[]) {
    console.log(`\n📊 Migrating ${assessments.length} assessments...`);
    let migrated = 0;

    for (const assessment of assessments) {
        try {
            const query = `
                INSERT INTO assessments (
                    assessment_id, title, description, difficulty, questions,
                    created_by, created_at, scheduled_for, scheduled_from,
                    scheduled_to, duration_minutes, assigned_to, retake_permissions
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (assessment_id) DO NOTHING
            `;
            const values = [
                assessment.assessment_id,
                assessment.title,
                assessment.description || null,
                assessment.difficulty || null,
                JSON.stringify(assessment.questions),
                assessment.created_by,
                assessment.created_at,
                assessment.scheduled_for || null,
                assessment.scheduled_from || null,
                assessment.scheduled_to || null,
                assessment.duration_minutes || null,
                assessment.assigned_to || [],
                assessment.retake_permissions || []
            ];
            await pool.query(query, values);
            migrated++;
        } catch (error) {
            console.error(`❌ Error migrating assessment ${assessment.title}:`, error);
        }
    }

    console.log(`✅ Migrated ${migrated}/${assessments.length} assessments`);
}

async function migrateResults(results: Result[]) {
    console.log(`\n📊 Migrating ${results.length} results...`);
    let migrated = 0;

    for (const result of results) {
        try {
            const query = `
                INSERT INTO results (assessment_id, user_id, result, timestamp)
                VALUES ($1, $2, $3, $4)
            `;
            const values = [
                result.assessment_id,
                result.user_id,
                JSON.stringify(result.result),
                result.timestamp
            ];
            await pool.query(query, values);
            migrated++;
        } catch (error) {
            console.error(`❌ Error migrating result:`, error);
        }
    }

    console.log(`✅ Migrated ${migrated}/${results.length} results`);
}

async function createBackups() {
    console.log('\n💾 Creating backups of JSON files...');
    const backupDir = path.join(DATA_DIR, 'backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const file of [USERS_FILE, ASSESSMENTS_FILE, RESULTS_FILE]) {
        if (fs.existsSync(file)) {
            const basename = path.basename(file);
            const backupPath = path.join(backupDir, `${basename}.${timestamp}.backup`);
            fs.copyFileSync(file, backupPath);
            console.log(`✅ Backed up ${basename}`);
        }
    }
}

async function main() {
    try {
        console.log('🚀 Starting data migration from JSON to PostgreSQL...\n');

        // Initialize database schema
        console.log('🔄 Initializing database schema...');
        await initializeDatabase();

        // Create backups
        await createBackups();

        // Read JSON files
        const users = readJsonFile<User>(USERS_FILE);
        const assessments = readJsonFile<Assessment>(ASSESSMENTS_FILE);
        const results = readJsonFile<Result>(RESULTS_FILE);

        // Migrate data
        await migrateUsers(users);
        await migrateAssessments(assessments);
        await migrateResults(results);

        // Verify migration
        console.log('\n📊 Verifying migration...');
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const assessmentCount = await pool.query('SELECT COUNT(*) FROM assessments');
        const resultCount = await pool.query('SELECT COUNT(*) FROM results');

        console.log(`\n✅ Migration Summary:`);
        console.log(`   Users: ${userCount.rows[0].count} in database (${users.length} in JSON)`);
        console.log(`   Assessments: ${assessmentCount.rows[0].count} in database (${assessments.length} in JSON)`);
        console.log(`   Results: ${resultCount.rows[0].count} in database (${results.length} in JSON)`);

        console.log('\n🎉 Migration completed successfully!');
        console.log('💡 JSON backups are stored in data/backups/');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
