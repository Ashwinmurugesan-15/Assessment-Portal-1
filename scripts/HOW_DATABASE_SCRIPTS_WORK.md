# How Database Scripts Work - Complete Guide from Scratch

## 📚 Understanding the Basics

### What are Database Scripts?

Think of setting up a database like **building a house**:

1. **DDL Script** = Building the house structure (walls, rooms, doors)
2. **Insert Script** = Furnishing the house (adding furniture, decorations)
3. **.env file** = Giving keys to the right person (who can access the house)

---

## 🏗️ The Complete Database Setup Flow

### Step-by-Step: What Happens from Scratch

```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE: Empty PostgreSQL Installation                      │
│ • PostgreSQL is installed                                  │
│ • Only 'postgres' superuser exists                          │
│ • No application database yet                              │
└─────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Create Database (Manual/Script)                    │
│ Command: createdb -U postgres assessment_engine            │
│                                                             │
│ Result: Empty database named 'assessment_engine' created   │
└─────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Run DDL Script (scripts/ddl.sql)                   │
│ Command: psql -U postgres -d assessment_engine -f ddl.sql  │
│                                                             │
│ What DDL does:                                             │
│ ✅ Creates user 'assessment_app_user'                      │
│ ✅ Creates schema 'assessment_schema'                      │
│ ✅ Grants schema ownership to the user                     │
│ ✅ Creates 3 tables (users, assessments, results)          │
│ ✅ Creates 10 indexes for performance                      │
│                                                             │
│ Result: Database structure is ready, but EMPTY             │
└─────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Run Insert Script (scripts/insert.sql)             │
│ Command: psql -U assessment_app_user -d assessment_engine  │
│          -f insert.sql                                      │
│                                                             │
│ What Insert does:                                          │
│ ✅ Inserts 1 admin user                                    │
│ ✅ Inserts 3 examiner users                                │
│ ✅ Inserts 4 candidate users                               │
│ ✅ Inserts 5 sample assessments                            │
│ ✅ Inserts 3 sample results                                │
│                                                             │
│ Result: Database has sample data to test with              │
└─────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Configure Application (.env.local)                 │
│                                                             │
│ DATABASE_URL=postgresql://assessment_app_user:             │
│   assessment_pass_2024@localhost:5432/                     │
│   assessment_engine?schema=assessment_schema               │
│                                                             │
│ Result: Application can connect to database                │
└─────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────┐
│ READY: Application Connected to Database!                  │
│ • Can login with sample users                              │
│ • Can view sample assessments                              │
│ • Can take assessments                                     │
│ • Can grade and view results                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Deep Dive: Understanding DDL Script

### What is DDL?

**DDL = Data Definition Language**

It defines the **STRUCTURE** of your database:
- Creating users (who can access)
- Creating schemas (organizing tables)
- Creating tables (where data lives)
- Creating columns (what data to store)
- Creating indexes (for faster searches)
- Setting permissions (security)

### Let's Read Your DDL Script Line by Line

Open `scripts/ddl.sql` and let's understand it:

#### Part 1: Create Database User (Lines 11-23)

```sql
CREATE USER assessment_app_user WITH PASSWORD 'assessment_pass_2024';
```

**Why do this?**
- ❌ **BAD**: Using `postgres` superuser for your app
  - Like giving master keys to everyone
  - If app is hacked, entire database is compromised
  
- ✅ **GOOD**: Create dedicated user `assessment_app_user`
  - Like giving a specific key that only opens your apartment
  - If app is hacked, attacker only gets limited access

**Real-world analogy:**
```
Postgres User = Building Master Key (can access ALL apartments)
App User = Apartment-specific Key (can only access your apartment)
```

#### Part 2: Create Schema (Lines 25-28)

```sql
CREATE SCHEMA IF NOT EXISTS assessment_schema;
```

**What is a Schema?**
Think of a database like a filing cabinet:
- **Database** = Entire filing cabinet
- **Schema** = Drawer in the cabinet
- **Table** = Folder in the drawer
- **Row** = Document in the folder

**Why use a dedicated schema?**

Without schema (uses 'public'):
```
Database
└── public schema (everyone uses this)
    ├── users (your table)
    ├── users (another app's table) ❌ CONFLICT!
    ├── assessments (your table)
    └── products (another app's table)
```

With dedicated schema:
```
Database
├── public schema (default, empty)
├── assessment_schema (YOUR app)
│   ├── users
│   ├── assessments
│   └── results
└── ecommerce_schema (another app)
    ├── users
    ├── products
    └── orders
```

**Benefits:**
1. **No name conflicts** - Each app has its own namespace
2. **Better security** - Grant access per schema
3. **Easier backup** - Backup just your schema
4. **Cleaner organization** - Know which tables belong to which app

#### Part 3: Grant Ownership (Lines 30-48)

```sql
ALTER SCHEMA assessment_schema OWNER TO assessment_app_user;
GRANT ALL PRIVILEGES ON SCHEMA assessment_schema TO assessment_app_user;
```

**What does this mean?**

Now `assessment_app_user`:
- ✅ Owns the `assessment_schema`
- ✅ Can create/modify/delete tables in this schema
- ❌ CANNOT access other schemas
- ❌ CANNOT create new databases
- ❌ CANNOT access other apps' data

**Security Principle: Least Privilege**
> Give only the permissions needed, nothing more

#### Part 4: Create Tables (Lines 62-118)

```sql
CREATE TABLE IF NOT EXISTS assessment_schema.users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    ...
);
```

**Notice the prefix:** `assessment_schema.users`
- Not just `users`
- Explicitly states it belongs to `assessment_schema`

**Three tables created:**

1. **users** - Stores all user accounts (candidates, examiners, admins)
2. **assessments** - Stores assessment details and questions (JSONB)
3. **results** - Stores assessment results and grades (JSONB)

**Foreign Keys = Relationships:**
```sql
FOREIGN KEY (created_by) REFERENCES assessment_schema.users(id)
```

This means:
- Every assessment MUST have a valid creator
- If you delete a user, their assessments are also deleted (CASCADE)

#### Part 5: Create Indexes (Lines 126-140)

```sql
CREATE INDEX idx_users_email ON assessment_schema.users(email);
```

**What are indexes?**

Without index:
```
Finding user with email "alice@example.com"
→ Search through ALL 10,000 users one by one
→ Slow! ❌
```

With index:
```
Finding user with email "alice@example.com"
→ Look up in index (like a phone book)
→ Jump directly to the user
→ Fast! ✅
```

**10 indexes created for:**
- Finding users by email (login)
- Finding users by role (list all candidates)
- Finding assessments by creator
- Finding assessments assigned to user
- Finding results by assessment
- Finding results by user

---

## 📝 Deep Dive: Understanding Insert Script

### What is an Insert Script?

It **populates** the database with initial data:
- Sample users you can login with
- Sample assessments to test
- Sample results to view

### Let's Read Your Insert Script

Open `scripts/insert.sql` and let's understand it:

#### Part 1: Insert Users

```sql
INSERT INTO assessment_schema.users (id, name, email, password, role, ...)
VALUES (
    'usr_admin_001',
    'System Admin',
    'admin@assessmentportal.com',
    '$2b$10$N8gHw0t8Z...',  -- Bcrypt hashed password
    'admin',
    ...
) ON CONFLICT (id) DO NOTHING;
```

**Key points:**

1. **Password is hashed:**
   ```
   Plain password: admin123
   Hashed: $2b$10$N8gHw0t8Z...
   ```
   Never store passwords in plain text! ✅

2. **ON CONFLICT DO NOTHING:**
   If user already exists, skip it
   → Script is **idempotent** (safe to run multiple times)

**8 Users Created:**
```
1 Admin
├─ admin@assessmentportal.com / admin123

3 Examiners
├─ sarah.johnson@assessmentportal.com / examiner123
├─ michael.chen@assessmentportal.com / examiner123
└─ emily.rodriguez@assessmentportal.com / examiner123

4 Candidates  
├─ alice.thompson@example.com / candidate123
├─ bob.martinez@example.com / candidate123
├─ carol.williams@example.com / candidate123
└─ david.kumar@example.com / candidate123
```

#### Part 2: Insert Assessments

```sql
INSERT INTO assessment_schema.assessments (
    assessment_id,
    title,
    questions,  -- JSONB array of questions
    difficulty,
    assigned_to,  -- Array of candidate IDs
    ...
) VALUES (...);
```

**5 Assessments Created:**
1. JavaScript Fundamentals (Medium)
2. Python Basics (Easy)
3. Data Structures and Algorithms (Hard)
4. Database Design (Medium)
5. System Design (Hard)

**Questions stored as JSONB:**
```json
[
  {
    "id": "1",
    "text": "What is the output of console.log(typeof null)?",
    "options": [
      {"id": "A", "text": "object"},
      {"id": "B", "text": "null"},
      {"id": "C", "text": "undefined"}
    ],
    "correct_option_id": "A",
    "explanation": "In JavaScript, typeof null returns 'object'..."
  }
]
```

#### Part 3: Insert Results

```sql
INSERT INTO assessment_schema.results (
    assessment_id,
    user_id,
    result,  -- JSONB grading result
    timestamp
) VALUES (...);
```

**3 Sample Results Created:**
- Alice's JavaScript Fundamentals result
- Bob's JavaScript Fundamentals result  
- Alice's Python Basics result

**Result stored as JSONB:**
```json
{
  "score": 8,
  "max_score": 10,
  "total_questions": 10,
  "correct_count": 8,
  "detailed": [...],
  "analytics": {
    "time_taken_seconds": 480,
    "accuracy_percent": 80
  }
}
```

---

## 🔐 Security: Why This Approach is Better

### Your Current Setup (What You're Using)

```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/assessment_engine
```

**Problems:**
1. ❌ Using `postgres` superuser
2. ❌ No schema isolation (using default `public`)
3. ❌ App has admin privileges

```
┌─────────────────────────────┐
│ PostgreSQL Database         │
├─────────────────────────────┤
│ Your App (postgres user)    │
│ ✓ Can read all data         │
│ ✓ Can delete all databases  │
│ ✓ Can create new users      │
│ ✓ Can modify permissions    │
│                             │
│ If app is hacked:           │
│ → Attacker controls ENTIRE  │
│   PostgreSQL server! 💥     │
└─────────────────────────────┘
```

### Proper Setup (What DDL Script Creates)

```env
DATABASE_URL=postgresql://assessment_app_user:assessment_pass_2024@localhost:5432/assessment_engine?schema=assessment_schema
```

**Benefits:**
1. ✅ Using dedicated `assessment_app_user`
2. ✅ Schema isolation (`assessment_schema`)
3. ✅ Least privilege (only access to own schema)

```
┌─────────────────────────────────┐
│ PostgreSQL Database             │
├─────────────────────────────────┤
│ Your App (assessment_app_user) │
│ ✓ Can access assessment_schema  │
│ ✗ CANNOT delete databases       │
│ ✗ CANNOT create new users       │
│ ✗ CANNOT access other schemas   │
│                                 │
│ If app is hacked:               │
│ → Attacker only gets access to  │
│   your app's data, not entire   │
│   PostgreSQL server! ✅         │
└─────────────────────────────────┘
```

---

## 🎯 Putting It All Together: Real Execution

### Automated Way (Recommended)

```powershell
# Run this ONE command
.\scripts\setup-database.ps1
```

**What it does:**
1. Checks if database exists
2. Creates database if needed
3. Runs DDL script (creates user, schema, tables)
4. Runs Insert script (adds sample data)
5. Shows success message with credentials

### Manual Way (Step by Step)

```powershell
# 1. Create database
createdb -U postgres assessment_engine

# 2. Run DDL script to create structure
psql -U postgres -d assessment_engine -f scripts/ddl.sql

# Output you'll see:
# NOTICE: Created user: assessment_app_user
# NOTICE: DDL Script Execution Complete!
# NOTICE: Tables Created: users, assessments, results

# 3. Run Insert script to add data
psql -U assessment_app_user -d assessment_engine -f scripts/insert.sql
# When prompted, enter password: assessment_pass_2024

# Output you'll see:
# INSERT 0 1 (for each user inserted)
# INSERT 0 1 (for each assessment inserted)
# INSERT 0 1 (for each result inserted)

# 4. Update .env.local
# Change:
DATABASE_URL=postgresql://postgres:123456@localhost:5432/assessment_engine
# To:
DATABASE_URL=postgresql://assessment_app_user:assessment_pass_2024@localhost:5432/assessment_engine?schema=assessment_schema

# 5. Restart your app
npm run dev
```

---

## 🔍 Verification: Check If It Worked

### Check if user was created:
```powershell
psql -U postgres -d assessment_engine -c "\du assessment_app_user"
```

Expected output:
```
          List of roles
 Role name         | Attributes
-------------------+------------
 assessment_app_user | 
```

### Check if schema was created:
```powershell
psql -U postgres -d assessment_engine -c "\dn assessment_schema"
```

Expected output:
```
      List of schemas
        Name         |      Owner
---------------------+------------------
 assessment_schema   | assessment_app_user
```

### Check if tables were created:
```powershell
psql -U postgres -d assessment_engine -c "\dt assessment_schema.*"
```

Expected output:
```
                    List of relations
 Schema            | Name         | Type  | Owner
-------------------+--------------+-------+------------------
 assessment_schema | assessments  | table | assessment_app_user
 assessment_schema | results      | table | assessment_app_user
 assessment_schema | users        | table | assessment_app_user
```

### Check if data was inserted:
```powershell
psql -U assessment_app_user -d assessment_engine -c "
    SELECT 
        (SELECT COUNT(*) FROM assessment_schema.users) as users,
        (SELECT COUNT(*) FROM assessment_schema.assessments) as assessments,
        (SELECT COUNT(*) FROM assessment_schema.results) as results;"
```

Expected output:
```
 users | assessments | results 
-------+-------------+---------
     8 |           5 |       3
```

---

## 📖 Summary

### DDL Script (scripts/ddl.sql)
**Purpose:** Create database STRUCTURE
**Runs as:** `postgres` (admin) → then creates restricted user
**Creates:**
- 1 database user: `assessment_app_user`
- 1 schema: `assessment_schema`
- 3 tables: `users`, `assessments`, `results`
- 10 indexes for performance
**Run once:** When setting up database

### Insert Script (scripts/insert.sql)  
**Purpose:** Add sample DATA
**Runs as:** `assessment_app_user` (restricted)
**Creates:**
- 8 users (1 admin, 3 examiners, 4 candidates)
- 5 assessments with questions
- 3 sample results
**Run once:** After DDL script
**Idempotent:** Safe to run multiple times

### Why This Matters
1. **Security:** App doesn't need admin access
2. **Isolation:** Your tables separated from others
3. **Maintainability:** Easy to recreate database
4. **Professional:** Industry standard practice

---

## 🚀 Next Steps

**Choose your path:**

### Path 1: Use Proper Setup (Recommended)
```powershell
# Run automated script
.\scripts\setup-database.ps1

# Update .env.local
DATABASE_URL=postgresql://assessment_app_user:assessment_pass_2024@localhost:5432/assessment_engine?schema=assessment_schema

# Restart app
npm run dev
```

### Path 2: Keep Current Setup (Development Only)
```
Keep using postgres user
Only for learning/development
NEVER for production
```

---

## ❓ Common Questions

**Q: Can I use both setups at the same time?**
A: Yes! They're different users accessing the same database.

**Q: What if I already have data in the database?**
A: The scripts won't delete existing data. DDL creates new schema, Insert uses `ON CONFLICT DO NOTHING`.

**Q: Can I modify the password in ddl.sql?**
A: Yes! Change `assessment_pass_2024` to your password, then update `.env.local` to match.

**Q: What if I run the Insert script multiple times?**
A: Safe! The `ON CONFLICT DO NOTHING` clause prevents duplicate entries.

**Q: How do I reset everything?**
A: Drop the database and recreate:
```powershell
dropdb -U postgres assessment_engine
createdb -U postgres assessment_engine
# Then run DDL and Insert scripts again
```

---

**Need help implementing this? Let me know which approach you want to take!**
