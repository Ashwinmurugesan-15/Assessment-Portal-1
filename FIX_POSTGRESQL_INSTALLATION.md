# Fix Incomplete PostgreSQL Installation

## Problem
Your PostgreSQL installation is incomplete. It only has 2 files in the bin directory:
- pg_ctl.exe
- postgres.exe

But it's missing essential tools:
- initdb.exe (needed to initialize database)
- psql.exe (needed to run SQL commands)
- createdb.exe (needed to create databases)
- And 50+ other utilities

## Solution: Reinstall PostgreSQL

### Step 1: Uninstall Current PostgreSQL

1. **Open Control Panel**
   - Press `Win + R`
   - Type: `appwiz.cpl`
   - Press Enter

2. **Find and uninstall:**
   - Look for "PostgreSQL 18"
   - Right-click → Uninstall
   - Follow the wizard

3. **Delete leftover files (as Administrator):**
   ```powershell
   Remove-Item "C:\Program Files\PostgreSQL" -Recurse -Force
   ```

### Step 2: Download PostgreSQL

1. **Go to:** https://www.postgresql.org/download/windows/
2. **Click:** "Download the installer"
3. **Choose:** PostgreSQL 16 (more stable than 18)
4. **Download:** The Windows x86-64 installer

### Step 3: Install PostgreSQL

1. **Run the installer** (as Administrator)
2. **Installation wizard:**
   - Click "Next"
   - Installation Directory: `C:\Program Files\PostgreSQL\16` (default is fine)
   - **IMPORTANT:** Select ALL components:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4
     - ✅ Stack Builder
     - ✅ Command Line Tools (THIS IS CRITICAL!)
   - Click "Next"
   - Data Directory: `C:\Program Files\PostgreSQL\16\data` (default is fine)
   - **Set Password:** Use `postgres` (remember this!)
   - Port: `5432` (default)
   - Locale: Default
   - Click "Next" → "Next" → "Finish"

3. **Verify installation:**
   ```powershell
   # Check if initdb exists
   Test-Path "C:\Program Files\PostgreSQL\16\bin\initdb.exe"
   # Should return: True
   
   # Check service
   Get-Service postgresql-x64-16
   # Should show: Running
   ```

### Step 4: Create Database

After successful installation, run these commands **as Administrator**:

```powershell
# Set password environment variable
$env:PGPASSWORD = "postgres"

# Create the database
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres assessment_engine

# Verify it was created
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "\l"

# Clean up
Remove-Item Env:\PGPASSWORD
```

### Step 5: Update Your Project

Update `.env.local`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assessment_engine
```

Then run:
```bash
npm run db:init
npm run db:migrate
npm run dev
```

---

## Alternative: Quick Fix Without Reinstalling

If you don't want to reinstall, you can download just the PostgreSQL binaries:

1. **Download:** https://www.enterprisedb.com/download-postgresql-binaries
2. **Extract** to `C:\PostgreSQL-Binaries`
3. **Copy all files** from `C:\PostgreSQL-Binaries\pgsql\bin\` to `C:\Program Files\PostgreSQL\18\bin\`
4. **Run the fix script again**

---

## Recommended Approach

**Reinstall PostgreSQL** - it's cleaner and ensures everything works correctly. The incomplete installation will cause more problems later.

Total time: ~10 minutes
