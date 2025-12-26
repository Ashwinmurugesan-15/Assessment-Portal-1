# Assessment Engine - PostgreSQL Setup Guide

## 🎯 Quick Start

The Assessment Engine uses **PostgreSQL** for data storage, making it easy to migrate to **YugabyteDB** later.

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed (or Docker)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up PostgreSQL**

   **Option A: Local Installation**
   - Download from https://www.postgresql.org/download/
   - Install and remember the `postgres` user password
   - Create database:
     ```bash
     psql -U postgres
     CREATE DATABASE assessment_engine;
     \q
     ```

   **Option B: Docker**
   ```bash
   docker run --name assessment-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=assessment_engine \
     -p 5432:5432 \
     -d postgres:16
   ```

3. **Configure Environment**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Update `DATABASE_URL` in `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/assessment_engine
   ```

4. **Initialize Database**
   ```bash
   npm run db:init
   ```

5. **Migrate Existing Data** (if you have JSON files)
   ```bash
   npm run db:migrate
   ```

6. **Start Application**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run prod:build` | Production build with type-check and lint |
| `npm run prod:start` | Start in production mode |
| `npm run db:init` | Initialize database schema |
| `npm run db:migrate` | Migrate data from JSON to PostgreSQL |
| `npm run health` | Check application health |

## 🚀 Production Deployment

### Quick Deploy with Docker

```bash
# Build and start with Docker Compose
docker-compose up -d

# Initialize database
docker-compose exec app npm run db:init

# Access at http://localhost:3000
```

### Deploy to Cloud Platforms

- **Vercel**: `vercel --prod` (see [docs/DEPLOYMENT.md](file:///d:/jagadeesh/assessment%20ai%20portal/assessment-engine/assessment-engine/docs/DEPLOYMENT.md))
- **Railway**: Connect GitHub repo and deploy automatically
- **VPS/Server**: Use PM2 for process management

See [Deployment Guide](file:///d:/jagadeesh/assessment%20ai%20portal/assessment-engine/assessment-engine/docs/DEPLOYMENT.md) for detailed instructions.

## 🔄 Migrating to YugabyteDB

When ready to switch to YugabyteDB:

1. Get your YugabyteDB connection string
2. Update `DATABASE_URL` in `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@yugadb-host:5433/database_name
   ```
3. Run initialization (if fresh database):
   ```bash
   npm run db:init
   npm run db:migrate
   ```
4. Restart the application

**That's it!** No code changes needed - YugabyteDB is PostgreSQL-compatible.

## 🗄️ Database Schema

The application uses three main tables:

- **users** - Stores candidates, examiners, and admins
- **assessments** - Stores assessment metadata and questions (JSONB)
- **results** - Stores assessment results and analytics (JSONB)

All tables have proper indexes and foreign key constraints for data integrity.

## ✨ Production Features

- ✅ **Security Headers** - XSS protection, CSP, HSTS
- ✅ **Health Checks** - `/api/health` endpoint for monitoring
- ✅ **Docker Support** - Multi-stage builds for optimal images
- ✅ **Environment Management** - Separate dev/prod configurations
- ✅ **Database Pooling** - Optimized connection management
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Production Build** - Optimized bundles with compression

## 🔧 Troubleshooting

**Connection refused error?**
- Make sure PostgreSQL is running
- Check the `DATABASE_URL` in `.env.local`

**Database doesn't exist?**
- Create it manually: `CREATE DATABASE assessment_engine;`

**Migration errors?**
- Ensure database is initialized first: `npm run db:init`
- Check that JSON files exist in `data/` directory

## 📚 Documentation

- [Deployment Guide](file:///d:/jagadeesh/assessment%20ai%20portal/assessment-engine/assessment-engine/docs/DEPLOYMENT.md) - Production deployment instructions
- [Configuration Guide](file:///d:/jagadeesh/assessment%20ai%20portal/assessment-engine/assessment-engine/docs/CONFIGURATION.md) - Environment configuration
- [Migration Walkthrough](file:///C:/Users/gowth/.gemini/antigravity/brain/65963f8a-3bf1-4069-b329-cf21b15df78b/walkthrough.md) - PostgreSQL migration details

## 🎉 What's New

✅ PostgreSQL database with ACID transactions  
✅ Proper relational integrity with foreign keys  
✅ Optimized queries with indexes  
✅ Easy migration path to YugabyteDB  
✅ Automatic data backups during migration  
✅ Production-ready with Docker support  
✅ Health monitoring and security headers  

---

**Version:** 1.0.0  
**License:** Private  
**Node:** >=18.0.0
