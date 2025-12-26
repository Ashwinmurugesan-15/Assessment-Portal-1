# Configuration Management Guide

## Overview

The Assessment Engine now uses a centralized configuration system with environment-specific files.

## Configuration Files

### Environment Files

| File | Purpose | Committed to Git |
|------|---------|------------------|
| `.env.local` | Your personal local overrides | ❌ No (gitignored) |
| `.env.development` | Development defaults | ✅ Yes |
| `.env.production` | Production template | ✅ Yes |
| `.env.example` | Complete example | ✅ Yes |

### Configuration Module

All configuration is centralized in [`lib/config.ts`](file:///d:/jagadeesh/assessment%20ai%20portal/assessment-engine/assessment-engine/lib/config.ts):

```typescript
import { config } from '@/lib/config';

// Access configuration
const dbUrl = config.database.url;
const apiBaseUrl = config.api.baseUrl;
const smtpHost = config.mail.host;
```

## Configuration Sections

### App Configuration
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_API_URL` - API base path
- `API_TIMEOUT` - API request timeout (ms)

### Database Configuration
- `DATABASE_URL` - PostgreSQL/YugabyteDB connection string
- `DB_MAX_CONNECTIONS` - Maximum connection pool size
- `DB_CONNECTION_TIMEOUT` - Connection timeout (ms)
- `DB_IDLE_TIMEOUT` - Idle connection timeout (ms)

### Email Configuration
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` - From email address
- `SMTP_SECURE` - Use TLS (true/false)

### Auth Configuration
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRY` - Token expiration time

### AI Configuration
- `GEMINI_API_KEY` - Google Gemini API key

## How It Works

Next.js automatically loads the correct environment file based on `NODE_ENV`:

1. **Development** (`NODE_ENV=development`):
   - Loads `.env.development`
   - Then `.env.local` (if exists) - overrides development defaults

2. **Production** (`NODE_ENV=production`):
   - Loads `.env.production`
   - Then `.env.local` (if exists) - overrides production defaults

## Usage

### Local Development

1. **Create `.env.local`** (if you need custom values):
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your personal settings

3. **Run the app**:
   ```bash
   npm run dev
   ```

The app will use `.env.development` + your `.env.local` overrides.

### Production Deployment

1. **Update `.env.production`** with actual production values

2. **Set environment variables** on your hosting platform (or use `.env.local` on server)

3. **Deploy**:
   ```bash
   npm run build
   npm start
   ```

## Best Practices

✅ **DO:**
- Use `.env.local` for personal/sensitive values
- Commit `.env.development` and `.env.production` to Git
- Access config through `lib/config.ts`, not `process.env` directly
- Use environment-specific values (dev DB vs prod DB)

❌ **DON'T:**
- Commit `.env.local` to Git (it's gitignored)
- Hardcode values in code
- Access `process.env` directly in application code
- Put production secrets in `.env.development`

## Migrating to YugabyteDB

When switching to YugabyteDB, just update the `DATABASE_URL`:

**In `.env.local` or `.env.production`:**
```env
DATABASE_URL=postgresql://user:password@yugadb-host:5433/database_name
```

No code changes needed - the configuration system handles it automatically!

## Troubleshooting

**Q: My changes aren't being picked up**
- Restart the dev server (`npm run dev`)
- Check you're editing the right file (`.env.local` overrides `.env.development`)

**Q: Which file should I edit?**
- Personal settings: `.env.local`
- Team development defaults: `.env.development`
- Production template: `.env.production`

**Q: How do I add a new config option?**
1. Add to `.env.example`, `.env.development`, `.env.production`
2. Add to `lib/config.ts`
3. Use via `config.yourSection.yourOption`
