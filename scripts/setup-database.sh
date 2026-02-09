#!/bin/bash

# ============================================================
# Database Setup Script
# Purpose: Execute DDL and Insert scripts in correct order
# ============================================================

set -e  # Exit on any error

echo "========================================"
echo "Assessment Portal - Database Setup"
echo "========================================"
echo ""

# Database configuration
DB_NAME="assessment_engine"
DB_USER="postgres"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📋 Configuration:"
echo "   Database: $DB_NAME"
echo "   Scripts Directory: $SCRIPT_DIR"
echo ""

# Step 1: Execute DDL Script
echo "🔧 Step 1: Executing DDL Script..."
echo "   Purpose: Create user, schema, and tables"
echo ""

sudo -u postgres psql -d "$DB_NAME" -f "$SCRIPT_DIR/ddl.sql"

if [ $? -eq 0 ]; then
    echo "✅ DDL Script executed successfully!"
else
    echo "❌ DDL Script failed!"
    exit 1
fi

echo ""
echo "========================================"
echo ""

# Step 2: Execute Insert Script  
echo "📝 Step 2: Executing Insert Script..."
echo "   Purpose: Insert sample data"
echo ""

# Run as the dedicated user
PGPASSWORD='assessment_pass_2024' psql -U assessment_app_user -d "$DB_NAME" -f "$SCRIPT_DIR/insert.sql"

if [ $? -eq 0 ]; then
    echo "✅ Insert Script executed successfully!"
else
    echo "❌ Insert Script failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Database Setup Complete!"
echo "========================================"
echo ""
echo "📝 Next Steps:"
echo "1. Update your .env.local file with:"
echo "   DATABASE_URL=postgresql://assessment_app_user:assessment_pass_2024@localhost:5432/assessment_engine?schema=assessment_schema"
echo ""
echo "2. Restart your application:"
echo "   npm run dev"
echo ""
echo "3. Login with:"
echo "   Email: admin@assessmentportal.com"
echo "   Password: admin123"
echo ""
echo "========================================"
