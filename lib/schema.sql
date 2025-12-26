-- Assessment Engine Database Schema
-- PostgreSQL / YugabyteDB Compatible

-- Users table (stores candidates, examiners, and admins)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'examiner', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_first_login BOOLEAN DEFAULT true,
    assigned_assessments TEXT[], -- For candidates
    created_assessments TEXT[] -- For examiners
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    assessment_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50),
    questions JSONB NOT NULL, -- Stores array of QuestionWithAnswer objects
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    scheduled_from TIMESTAMP,
    scheduled_to TIMESTAMP,
    duration_minutes INTEGER,
    assigned_to TEXT[] NOT NULL DEFAULT '{}', -- Array of candidate IDs
    retake_permissions TEXT[] DEFAULT '{}', -- Array of candidate IDs allowed to retake
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    result JSONB NOT NULL, -- Stores GradingResult object
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_assigned_to ON assessments USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_results_assessment_id ON results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment_user ON results(assessment_id, user_id);
