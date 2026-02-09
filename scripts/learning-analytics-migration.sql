
-- Create learning_progress table
CREATE TABLE IF NOT EXISTS learning_progress (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id VARCHAR(255) NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_resource UNIQUE (user_id, resource_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_resource_id ON learning_progress(resource_id);

-- Add comments
COMMENT ON TABLE learning_progress IS 'Tracks which candidates have viewed learning resources';
COMMENT ON COLUMN learning_progress.viewed_at IS 'Timestamp when the user first viewed/clicked the resource';
