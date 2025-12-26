# PostgreSQL Troubleshooting Guide

## Issue: PostgreSQL Service Stops Immediately

The PostgreSQL service is starting but stopping automatically. This usually happens due to:

1. **Port conflict** - Another service using port 5432
2. **Data directory issues** - Corrupted or missing data files
3. **Permission issues** - PostgreSQL can't access its data directory
4. **Configuration errors** - Invalid settings in postgresql.conf

## Quick Solutions

### Solution 1: Use a Cloud Database (Recommended - Fastest)

Instead of troubleshooting local PostgreSQL, use a free cloud database:

**Neon.tech (Free tier, no credit card required):**
1. Go to https://neon.tech
2. Sign up with GitHub/Google
3. Create a project named "assessment-engine"
4. Copy the connection string
5. Update `.env.local` with the connection string
6. Run `npm run db:init` and `npm run db:migrate`

**Supabase (Free tier):**
1. Go to https://supabase.com
2. Sign up and create a new project
3. Go to Project Settings → Database
4. Copy the connection string (Connection pooling)
5. Update `.env.local`
6. Run initialization scripts

### Solution 2: Reinstall PostgreSQL Data Directory

If you want to use local PostgreSQL:

1. **Stop the service** (if running)
2. **Backup and remove data directory:**
   ```powershell
   # As Administrator
   Stop-Service postgresql-x64-18
   Rename-Item "C:\Program Files\PostgreSQL\18\data" "C:\Program Files\PostgreSQL\18\data.backup"
   ```

3. **Reinitialize database:**
   ```powershell
   # As Administrator
   & "C:\Program Files\PostgreSQL\18\bin\initdb.exe" -D "C:\Program Files\PostgreSQL\18\data" -U postgres -W -E UTF8
   ```

4. **Start service:**
   ```powershell
   Start-Service postgresql-x64-18
   ```

### Solution 3: Check Port Conflict

```powershell
# Check if port 5432 is in use
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue

# If something is using it, you can:
# 1. Stop that service
# 2. Or change PostgreSQL port in postgresql.conf
```

### Solution 4: Check Event Logs

```powershell
# View PostgreSQL errors
Get-EventLog -LogName Application -Source "postgresql*" -Newest 10 | Format-List
```

## Recommended Approach

For fastest setup and to avoid local installation issues:

1. **Use Neon.tech** (free, no credit card, instant setup)
2. Update `.env.local` with the connection string
3. Run the migration scripts
4. Your app will work immediately

This also makes it easier to switch to YugabyteDB later since you're already using a cloud database.

## After PostgreSQL is Running

Once you have PostgreSQL running (local or cloud):

```bash
# Initialize database schema
npm run db:init

# Migrate existing data
npm run db:migrate

# Restart application
npm run dev
```
