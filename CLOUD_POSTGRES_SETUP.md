# Quick Cloud PostgreSQL Setup (Recommended)

Since local PostgreSQL is having installation issues, use a **free cloud database** instead. This is actually **better** because:
- ✅ No installation needed
- ✅ Works immediately
- ✅ Free forever (no credit card required)
- ✅ Perfect for development
- ✅ Easy to switch to YugabyteDB later

## Option 1: Neon.tech (Fastest - 2 minutes)

1. **Go to:** https://neon.tech
2. **Click:** "Sign up" (use GitHub or Google)
3. **Create project:** Name it "assessment-engine"
4. **Copy connection string:** It will look like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb
   ```

5. **Update your `.env.local` file:**
   - Open: `d:\jagadeesh\assessment ai portal\assessment-engine\assessment-engine\.env.local`
   - Find the line: `DATABASE_URL=...`
   - Replace it with your Neon connection string
   - Save the file

6. **Run these commands in your regular terminal (not admin):**
   ```bash
   cd 'd:\jagadeesh\assessment ai portal\assessment-engine\assessment-engine'
   npm run db:init
   npm run db:migrate
   npm run dev
   ```

**Done!** Your app will be running with PostgreSQL in 2 minutes.

---

## Option 2: Supabase (Also Free)

1. **Go to:** https://supabase.com
2. **Sign up** with GitHub/Google
3. **Create new project:** Name it "assessment-engine"
4. **Go to:** Project Settings → Database
5. **Copy:** Connection string (use "Connection pooling" mode)
6. **Update `.env.local`** with the connection string
7. **Run:** `npm run db:init` and `npm run db:migrate`

---

## Why Cloud is Better Than Local

| Local PostgreSQL | Cloud PostgreSQL |
|-----------------|------------------|
| ❌ Installation issues | ✅ No installation |
| ❌ Service management | ✅ Always running |
| ❌ Port conflicts | ✅ No conflicts |
| ❌ Admin privileges needed | ✅ Just sign up |
| ⏱️ 30+ minutes troubleshooting | ⏱️ 2 minutes setup |

---

## After You Get the Connection String

Just let me know, and I'll help you:
1. Update the `.env.local` file
2. Run the database initialization
3. Migrate your data
4. Get your app running

**Recommendation:** Use Neon.tech - it's the fastest and easiest option.
