# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL or YugabyteDB instance
- Environment variables configured

## Deployment Options

### Option 1: Docker Deployment (Recommended)

**1. Build and run with Docker Compose:**

```bash
# Build and start all services
docker-compose up -d

# Initialize database
docker-compose exec app npm run db:init

# Migrate data (if needed)
docker-compose exec app npm run db:migrate

# Check logs
docker-compose logs -f app
```

**2. Access the application:**
- Application: http://localhost:3000
- Health check: http://localhost:3000/api/health

**3. Stop services:**
```bash
docker-compose down
```

---

### Option 2: Vercel Deployment

**1. Install Vercel CLI:**
```bash
npm install -g vercel
```

**2. Configure environment variables in Vercel:**
- Go to your project settings
- Add all variables from `.env.production`
- Ensure `DATABASE_URL` points to your production database

**3. Deploy:**
```bash
vercel --prod
```

**4. Run database migrations:**
```bash
# SSH into your database server or use a migration tool
npm run db:init
npm run db:migrate
```

---

### Option 3: Railway Deployment

**1. Create `railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run prod:start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**2. Deploy:**
- Connect your GitHub repository to Railway
- Add PostgreSQL service
- Set environment variables
- Deploy automatically on push

---

### Option 4: Traditional VPS/Server

**1. Clone repository:**
```bash
git clone <your-repo-url>
cd assessment-engine
```

**2. Install dependencies:**
```bash
npm ci --production=false
```

**3. Set up environment:**
```bash
cp .env.production .env.local
# Edit .env.local with your production values
```

**4. Build application:**
```bash
npm run prod:build
```

**5. Initialize database:**
```bash
npm run db:init
npm run db:migrate
```

**6. Start application:**
```bash
npm run prod:start
```

**7. Use PM2 for process management (recommended):**
```bash
npm install -g pm2
pm2 start npm --name "assessment-engine" -- run prod:start
pm2 save
pm2 startup
```

---

## Environment Variables

Ensure these are set in production:

### Required
- `DATABASE_URL` - PostgreSQL/YugabyteDB connection string
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `JWT_SECRET` - Strong random secret (use: `openssl rand -base64 32`)

### Email (if using email features)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`

### Optional
- `GEMINI_API_KEY` - For AI features
- `DB_MAX_CONNECTIONS` - Database pool size (default: 50)
- `API_TIMEOUT` - API timeout in ms (default: 30000)

---

## Database Setup

### PostgreSQL

```bash
# Create database
createdb assessment_engine

# Initialize schema
npm run db:init

# Migrate data (if migrating from existing system)
npm run db:migrate
```

### YugabyteDB

```bash
# Connect to YugabyteDB
ysqlsh -h <host> -U <user> -d yugabyte

# Create database
CREATE DATABASE assessment_engine;

# Exit and run migrations
npm run db:init
npm run db:migrate
```

---

## Health Checks

Monitor your deployment:

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-22T...",
  "uptime": 12345,
  "environment": "production",
  "checks": {
    "database": "healthy",
    "application": "healthy"
  }
}
```

---

## Production Checklist

- [ ] Environment variables set correctly
- [ ] Database initialized and migrated
- [ ] `JWT_SECRET` is strong and unique
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] HTTPS enabled (use reverse proxy like Nginx)
- [ ] Database backups configured
- [ ] Monitoring/logging set up
- [ ] Health check endpoint working
- [ ] Error tracking configured (optional: Sentry)

---

## Troubleshooting

### Application won't start
- Check `npm run health` output
- Verify DATABASE_URL is correct
- Check logs: `docker-compose logs app` or `pm2 logs`

### Database connection errors
- Verify database is running
- Check connection string format
- Ensure firewall allows connections
- Test with: `npm run db:verify`

### Build failures
- Run `npm run type-check` to find TypeScript errors
- Run `npm run lint:fix` to fix linting issues
- Clear `.next` folder and rebuild

---

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Deploy multiple instances
- Use connection pooling (already configured)

### Database Scaling
- Switch to YugabyteDB for distributed SQL
- Configure read replicas
- Increase `DB_MAX_CONNECTIONS` based on instance count

---

## Security

- Always use HTTPS in production
- Keep dependencies updated: `npm audit fix`
- Use strong JWT_SECRET
- Enable rate limiting (consider adding middleware)
- Regular security audits

---

## Support

For issues or questions:
1. Check logs first
2. Verify environment variables
3. Test health endpoint
4. Review this guide

Happy deploying! 🚀
