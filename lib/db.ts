import pool from './db-pool';
import { QuestionWithAnswer, GradingResult, User, Candidate, Examiner, Admin } from '@/types';

interface AssessmentData {
    assessment_id: string;
    title: string;
    description?: string;
    difficulty?: string;
    questions: QuestionWithAnswer[];
    created_by: string;
    created_at: string;
    scheduled_for?: string;
    scheduled_from?: string;
    scheduled_to?: string;
    duration_minutes?: number;
    assigned_to: string[];
    retake_permissions?: string[];
}

interface ResultData {
    assessment_id: string;
    user_id: string;
    result: GradingResult;
    timestamp: string;
}

export const db = {
    // User Management
    createUser: async (user: Candidate | Examiner | Admin) => {
        const query = `
            INSERT INTO users (id, name, email, password, role, created_at, is_first_login, assigned_assessments, created_assessments)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            user.id,
            user.name,
            user.email,
            user.password,
            user.role,
            user.created_at,
            user.is_first_login ?? true,
            user.role === 'candidate' ? (user as Candidate).assigned_assessments : null,
            user.role === 'examiner' ? (user as Examiner).created_assessments : null
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    getUserByEmail: async (email: string) => {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    },

    getUserById: async (id: string) => {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    },

    getAllCandidates: async () => {
        const query = 'SELECT * FROM users WHERE role = $1';
        const result = await pool.query(query, ['candidate']);
        return result.rows as Candidate[];
    },

    getAllExaminers: async () => {
        const query = 'SELECT * FROM users WHERE role = $1';
        const result = await pool.query(query, ['examiner']);
        return result.rows as Examiner[];
    },

    getAllAdmins: async () => {
        const query = 'SELECT * FROM users WHERE role = $1';
        const result = await pool.query(query, ['admin']);
        return result.rows as Admin[];
    },

    getAllUsers: async () => {
        const query = 'SELECT * FROM users';
        const result = await pool.query(query);
        return result.rows as User[];
    },

    updateUser: async (id: string, updates: Partial<User>) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);

        if (fields.length === 0) return null;

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`;

        const result = await pool.query(query, [id, ...values]);
        return result.rows[0] || null;
    },

    // Assessment Management
    saveAssessment: async (assessment: AssessmentData) => {
        const query = `
            INSERT INTO assessments (
                assessment_id, title, description, difficulty, questions, 
                created_by, created_at, scheduled_for, scheduled_from, 
                scheduled_to, duration_minutes, assigned_to, retake_permissions
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
            assessment.assigned_to,
            assessment.retake_permissions || []
        ];
        await pool.query(query, values);
    },

    getAssessment: async (id: string) => {
        const query = 'SELECT * FROM assessments WHERE assessment_id = $1';
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            ...row,
            questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
        };
    },

    getAllAssessments: async () => {
        const query = 'SELECT * FROM assessments ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows.map(row => ({
            ...row,
            questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
        }));
    },

    getAssessmentsByCandidate: async (candidateId: string) => {
        const query = 'SELECT * FROM assessments WHERE $1 = ANY(assigned_to) ORDER BY created_at DESC';
        const result = await pool.query(query, [candidateId]);
        return result.rows.map(row => ({
            ...row,
            questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
        }));
    },

    getAssessmentsByExaminer: async (examinerId: string) => {
        // Get all admin IDs
        const adminQuery = 'SELECT id FROM users WHERE role = $1';
        const adminResult = await pool.query(adminQuery, ['admin']);
        const adminIds = adminResult.rows.map(row => row.id);

        // Get assessments created by examiner or any admin
        const query = 'SELECT * FROM assessments WHERE created_by = ANY($1) ORDER BY created_at DESC';
        const result = await pool.query(query, [[examinerId, ...adminIds]]);
        return result.rows.map(row => ({
            ...row,
            questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
        }));
    },

    // Results Management
    saveResult: async (result: GradingResult) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check for placeholder result
            const checkQuery = `
                SELECT id FROM results 
                WHERE assessment_id = $1 AND user_id = $2 
                AND (result->>'total_questions')::int = 0
            `;
            const checkResult = await client.query(checkQuery, [result.assessment_id, result.user_id]);

            if (checkResult.rows.length > 0) {
                // Update placeholder
                const updateQuery = `
                    UPDATE results 
                    SET result = $1, timestamp = $2 
                    WHERE id = $3
                `;
                await client.query(updateQuery, [
                    JSON.stringify(result),
                    new Date().toISOString(),
                    checkResult.rows[0].id
                ]);
            } else {
                // Insert new result
                const insertQuery = `
                    INSERT INTO results (assessment_id, user_id, result, timestamp)
                    VALUES ($1, $2, $3, $4)
                `;
                await client.query(insertQuery, [
                    result.assessment_id,
                    result.user_id,
                    JSON.stringify(result),
                    new Date().toISOString()
                ]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    getResults: async (assessmentId: string) => {
        const query = 'SELECT * FROM results WHERE assessment_id = $1 ORDER BY timestamp DESC';
        const result = await pool.query(query, [assessmentId]);
        return result.rows.map(row => ({
            ...row,
            result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result
        }));
    },

    getResultsByUser: async (userId: string) => {
        const query = 'SELECT * FROM results WHERE user_id = $1 ORDER BY timestamp DESC';
        const result = await pool.query(query, [userId]);
        return result.rows.map(row => ({
            ...row,
            result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result
        }));
    },

    getAllResults: async () => {
        const query = 'SELECT * FROM results ORDER BY timestamp DESC';
        const result = await pool.query(query);
        return result.rows.map(row => ({
            ...row,
            result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result
        }));
    },

    getUserAttemptCount: async (assessmentId: string, userId: string) => {
        const query = `
            SELECT COUNT(*) as count FROM results 
            WHERE assessment_id = $1 AND user_id = $2 
            AND (result->>'total_questions')::int > 0
        `;
        const result = await pool.query(query, [assessmentId, userId]);
        return parseInt(result.rows[0].count);
    },

    markAssessmentStarted: async (assessmentId: string, userId: string) => {
        // Check if already exists
        const checkQuery = 'SELECT id FROM results WHERE assessment_id = $1 AND user_id = $2';
        const checkResult = await pool.query(checkQuery, [assessmentId, userId]);

        if (checkResult.rows.length > 0) return;

        // Create placeholder
        const placeholderResult: GradingResult = {
            assessment_id: assessmentId,
            user_id: userId,
            score: 0,
            max_score: 100,
            total_questions: 0,
            correct_count: 0,
            detailed: [],
            analytics: {
                time_taken_seconds: 0,
                accuracy_percent: 0,
                avg_time_per_question_seconds: 0
            },
            graded_at: new Date().toISOString()
        };

        const insertQuery = `
            INSERT INTO results (assessment_id, user_id, result, timestamp)
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(insertQuery, [
            assessmentId,
            userId,
            JSON.stringify(placeholderResult),
            new Date().toISOString()
        ]);
    },

    deleteUser: async (userId: string) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Remove user from assessment assignments
            const updateQuery = `
                UPDATE assessments 
                SET assigned_to = array_remove(assigned_to, $1)
                WHERE $1 = ANY(assigned_to)
            `;
            await client.query(updateQuery, [userId]);

            // Delete user (results will cascade delete)
            const deleteQuery = 'DELETE FROM users WHERE id = $1';
            await client.query(deleteQuery, [userId]);

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    updateAssessment: async (id: string, updates: Partial<AssessmentData>) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates).map(val =>
            Array.isArray(val) || typeof val === 'object' ? JSON.stringify(val) : val
        );

        if (fields.length === 0) return null;

        const setClause = fields.map((field, index) => {
            if (field === 'questions') {
                return `${field} = $${index + 2}::jsonb`;
            }
            return `${field} = $${index + 2}`;
        }).join(', ');

        const query = `UPDATE assessments SET ${setClause} WHERE assessment_id = $1 RETURNING *`;
        const result = await pool.query(query, [id, ...values]);

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            ...row,
            questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
        };
    },

    deleteAssessment: async (id: string) => {
        // Results will cascade delete due to foreign key
        const query = 'DELETE FROM assessments WHERE assessment_id = $1';
        await pool.query(query, [id]);
        return true;
    }
};
