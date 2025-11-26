// User types
export interface User {
    id: string;
    name: string;
    email: string;
    password: string; // In production, this should be hashed
    role: 'candidate' | 'examiner';
    created_at: string;
}

export interface Candidate extends User {
    role: 'candidate';
    assigned_assessments: string[]; // Assessment IDs
}

export interface Examiner extends User {
    role: 'examiner';
    created_assessments: string[]; // Assessment IDs they created
}

// Existing types...
export interface Option {
    id: string;
    text: string;
}

export interface Question {
    id: string;
    text: string;
    options: Option[];
    time_limit_seconds?: number;
    meta?: {
        difficulty?: string;
        source_file?: string;
        [key: string]: any;
    };
}

export interface QuestionWithAnswer extends Question {
    correct_option_id: string;
    explanation?: string;
}

export interface Assessment {
    assessment_id: string;
    title: string;
    description?: string;
    questions: QuestionWithAnswer[];
    created_by: string; // Examiner ID
    created_at: string;
    scheduled_for?: string; // ISO date string
    duration_minutes?: number;
    assigned_to: string[]; // Candidate IDs
    retake_permissions?: string[]; // Candidate IDs allowed to retake
}

export interface AssessmentResponse {
    assessment_id: string;
    title: string;
    description?: string;
    questions: Question[];
    instructions?: string;
    duration_minutes?: number;
}

export interface AnswerSubmission {
    question_id: string;
    option_id: string;
}

export interface GradingRequest {
    assessment_id: string;
    user_id: string;
    answers: AnswerSubmission[];
    time_started: string;
    time_submitted: string;
}

export interface DetailedResult {
    question_id: string;
    submitted: string;
    correct: string;
    is_correct: boolean;
    points_awarded: number;
    explanation?: string;
}

export interface Analytics {
    time_taken_seconds: number;
    avg_time_per_question_seconds: number;
    accuracy_percent: number;
}

export interface GradingResult {
    user_id: string;
    assessment_id: string;
    score: number;
    max_score: number;
    correct_count: number;
    total_questions: number;
    detailed: DetailedResult[];
    analytics: Analytics;
    graded_at: string;
}

export interface ScoreDistribution {
    min: number;
    max: number;
    mean: number;
    median: number;
}

export interface AdminAnalyticsData {
    total_attempts: number;
    unique_users_attempted: number;
    avg_total_time_seconds: number;
    avg_time_per_question_seconds: number;
    score_distribution: ScoreDistribution;
}

export interface AdminAnalytics {
    assessment_id: string;
    admin_analytics: AdminAnalyticsData;
}
