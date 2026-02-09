
import { db } from '../lib/db';
import pool from '../lib/db-pool';

async function fixSchema() {
    try {
        console.log('Checking for image_url column in assessment_schema...');
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'learning_resources' 
            AND column_name = 'image_url'
            AND table_schema = 'assessment_schema';
        `;
        const result = await pool.query(checkQuery);

        if (result.rows.length === 0) {
            console.log('Column image_url missing in assessment_schema.learning_resources. Adding it now...');
            await pool.query("ALTER TABLE assessment_schema.learning_resources ADD COLUMN image_url TEXT;");
            console.log('Column added successfully!');
        } else {
            console.log('Column image_url already exists in assessment_schema.');
            console.log('Ensuring it is nullable...');
            await pool.query("ALTER TABLE assessment_schema.learning_resources ALTER COLUMN image_url DROP NOT NULL;");
            console.log('Column updated successfully!');
        }
    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await pool.end();
    }
}

fixSchema();
