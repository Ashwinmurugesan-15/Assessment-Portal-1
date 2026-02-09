-- Learning Resources Migration Script
-- Creates the learning_resources table for storing course links and descriptions

-- Create learning_resources table
CREATE TABLE IF NOT EXISTS learning_resources (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    course_url TEXT NOT NULL,
    url_type VARCHAR(50) DEFAULT 'generic' CHECK (url_type IN ('youtube', 'generic')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_resources_created_by ON learning_resources(created_by);
CREATE INDEX IF NOT EXISTS idx_learning_resources_created_at ON learning_resources(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE learning_resources IS 'Stores learning resources (courses, tutorials, etc.) that can be shared with candidates';
COMMENT ON COLUMN learning_resources.id IS 'Unique identifier for the learning resource';
COMMENT ON COLUMN learning_resources.title IS 'Title of the learning resource';
COMMENT ON COLUMN learning_resources.description IS 'Detailed description of what the resource covers';
COMMENT ON COLUMN learning_resources.course_url IS 'URL to the learning resource (YouTube, website, etc.)';
COMMENT ON COLUMN learning_resources.url_type IS 'Type of URL: youtube or generic';
COMMENT ON COLUMN learning_resources.created_by IS 'User ID of the admin/examiner who created this resource';
COMMENT ON COLUMN learning_resources.created_at IS 'Timestamp when the resource was created';
COMMENT ON COLUMN learning_resources.updated_at IS 'Timestamp when the resource was last updated';
