import fs from 'fs'; // Recompile trigger
import path from 'path';
import { QuestionWithAnswer, GradingResult, User, Candidate, Examiner, Assessment } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ASSESSMENTS_FILE = path.join(DATA_DIR, 'assessments.json');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

interface AssessmentData {
    id: string;
    title: string;
    description?: string;
    questions: QuestionWithAnswer[];
    created_by: string;
    created_at: string;
    scheduled_for?: string;
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

function readJson<T>(file: string): T[] {
    if (!fs.existsSync(file)) return [];
    try {
        const data = fs.readFileSync(file, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeJson<T>(file: string, data: T[]) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export const db = {
    // User Management
    createUser: (user: Candidate | Examiner) => {
        const users = readJson<User>(USERS_FILE);
        users.push(user);
        writeJson(USERS_FILE, users);
        return user;
    },

    getUserByEmail: (email: string) => {
        const users = readJson<User>(USERS_FILE);
        return users.find(u => u.email === email);
    },

    getUserById: (id: string) => {
        const users = readJson<User>(USERS_FILE);
        return users.find(u => u.id === id);
    },

    getAllCandidates: () => {
        const users = readJson<User>(USERS_FILE);
        return users.filter(u => u.role === 'candidate') as Candidate[];
    },

    getAllExaminers: () => {
        const users = readJson<User>(USERS_FILE);
        return users.filter(u => u.role === 'examiner') as Examiner[];
    },

    // Assessment Management
    saveAssessment: (assessment: AssessmentData) => {
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        assessments.push(assessment);
        writeJson(ASSESSMENTS_FILE, assessments);
    },

    getAssessment: (id: string) => {
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        return assessments.find(a => a.id === id);
    },

    getAllAssessments: () => {
        return readJson<AssessmentData>(ASSESSMENTS_FILE);
    },

    getAssessmentsByCandidate: (candidateId: string) => {
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        // Ensure each assessment has an assigned_to array before filtering
        return assessments.filter(a => {
            const assigned = Array.isArray(a.assigned_to) ? a.assigned_to : [];
            return assigned.includes(candidateId);
        });
    },

    getAssessmentsByExaminer: (examinerId: string) => {
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        return assessments.filter(a => a.created_by === examinerId);
    },

    // Results Management
    saveResult: (result: GradingResult) => {
        const results = readJson<ResultData>(RESULTS_FILE);

        // Check if there's an existing result (placeholder or real) for this user and assessment
        const existingIndex = results.findIndex(
            r => r.assessment_id === result.assessment_id && r.user_id === result.user_id
        );

        if (existingIndex !== -1) {
            // Replace the existing result (whether placeholder or real)
            results[existingIndex] = {
                assessment_id: result.assessment_id,
                user_id: result.user_id,
                result,
                timestamp: new Date().toISOString()
            };
        } else {
            // Add new result
            results.push({
                assessment_id: result.assessment_id,
                user_id: result.user_id,
                result,
                timestamp: new Date().toISOString()
            });
        }

        writeJson(RESULTS_FILE, results);
    },

    getResults: (assessmentId: string) => {
        const results = readJson<ResultData>(RESULTS_FILE);
        return results.filter(r => r.assessment_id === assessmentId);
    },

    getResultsByUser: (userId: string) => {
        const results = readJson<ResultData>(RESULTS_FILE);
        return results.filter(r => r.user_id === userId);
    },

    getAllResults: () => {
        return readJson<ResultData>(RESULTS_FILE);
    },

    getUserAttemptCount: (assessmentId: string, userId: string) => {
        const results = readJson<ResultData>(RESULTS_FILE);
        // Only count actual submissions, not placeholders
        return results.filter(r => 
            r.assessment_id === assessmentId && 
            r.user_id === userId && 
            r.result.total_questions > 0  // Placeholder results have 0 questions
        ).length;
    },

    // Mark assessment as started (to prevent retakes even if not submitted)
    markAssessmentStarted: (assessmentId: string, userId: string) => {
        const results = readJson<ResultData>(RESULTS_FILE);

        // Check if already has a result
        const existing = results.find(r => r.assessment_id === assessmentId && r.user_id === userId);
        if (existing) return; // Already started or completed

        // Create a placeholder result to mark as started
        results.push({
            assessment_id: assessmentId,
            user_id: userId,
            result: {
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
            },
            timestamp: new Date().toISOString()
        });
        writeJson(RESULTS_FILE, results);
    },

    // User deletion
    deleteUser: (userId: string) => {
        const users = readJson<User>(USERS_FILE);
        const filteredUsers = users.filter(u => u.id !== userId);
        writeJson(USERS_FILE, filteredUsers);

        // Also remove user from all assessment assignments
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        const updatedAssessments = assessments.map(a => ({
            ...a,
            assigned_to: a.assigned_to.filter(id => id !== userId)
        }));
        writeJson(ASSESSMENTS_FILE, updatedAssessments);

        return true;
    },

    // Update assessment (for granting retake access, etc.)
    updateAssessment: (id: string, updates: Partial<AssessmentData>) => {
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        const index = assessments.findIndex(a => a.id === id);
        if (index === -1) return null;

        assessments[index] = { ...assessments[index], ...updates };
        writeJson(ASSESSMENTS_FILE, assessments);
        return assessments[index];
    },

    // Delete assessment and clean up related data
    deleteAssessment: (id: string) => {
        // Remove assessment from assessments file
        const assessments = readJson<AssessmentData>(ASSESSMENTS_FILE);
        const filteredAssessments = assessments.filter(a => a.id !== id);
        writeJson(ASSESSMENTS_FILE, filteredAssessments);

        // Remove related results from results file
        const results = readJson<ResultData>(RESULTS_FILE);
        const filteredResults = results.filter(r => r.assessment_id !== id);
        writeJson(RESULTS_FILE, filteredResults);

        return true;
    }
};
