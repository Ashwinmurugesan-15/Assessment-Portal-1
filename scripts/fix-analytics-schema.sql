
-- Fix learning_progress schema
BEGIN;
    -- Drop the table in public if it exists and we don't want it there
    DROP TABLE IF EXISTS public.learning_progress;

    -- Create in assessment_schema
    CREATE TABLE IF NOT EXISTS assessment_schema.learning_progress (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES assessment_schema.users(id) ON DELETE CASCADE,
        resource_id VARCHAR(255) NOT NULL REFERENCES assessment_schema.learning_resources(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_resource UNIQUE (user_id, resource_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON assessment_schema.learning_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_learning_progress_resource_id ON assessment_schema.learning_progress(resource_id);

    -- Add comments
    COMMENT ON TABLE assessment_schema.learning_progress IS 'Tracks which candidates have viewed learning resources';
    COMMENT ON COLUMN assessment_schema.learning_progress.viewed_at IS 'Timestamp when the user first viewed/clicked the resource';
COMMIT;
