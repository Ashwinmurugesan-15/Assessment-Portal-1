# Quick Reference: Update .env.local

Your `.env.local` file needs to be updated with the correct PostgreSQL password.

## Change This Line:

**FROM:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assessment_engine
```

**TO:**
```
DATABASE_URL=postgresql://postgres:123456@localhost:5432/assessment_engine
```

## Location:
- File: `d:\jagadeesh\assessment ai portal\assessment-engine\assessment-engine\.env.local`
- Line: 10

## After Saving:

Reply "done" or "saved" and the following will run automatically:
1. `npm run db:init` - Initialize database schema
2. `npm run db:migrate` - Migrate your data from JSON files
3. Restart application with PostgreSQL

---

**Note:** The file is already open in your editor. Just change `postgres` to `123456` in the password part of the DATABASE_URL.
