# Production Deployment Checklist

Use this checklist before deploying to production:

## Pre-Deployment

### Environment Configuration
- [ ] `.env.production` updated with production values
- [ ] `DATABASE_URL` points to production database
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `JWT_SECRET` is strong and unique (use `openssl rand -base64 32`)
- [ ] SMTP credentials configured for production
- [ ] All sensitive values are secure

### Database
- [ ] Production database created
- [ ] Database migrations run (`npm run db:init`)
- [ ] Data migrated if needed (`npm run db:migrate`)
- [ ] Database backups configured
- [ ] Connection pooling configured appropriately

### Code Quality
- [ ] All tests passing
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Linting passed (`npm run lint`)
- [ ] Production build successful (`npm run prod:build`)
- [ ] No console.log statements in production code

### Security
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Security headers configured (already in next.config.ts)
- [ ] CORS configured properly
- [ ] Rate limiting considered
- [ ] Dependencies updated (`npm audit fix`)

## Deployment

### Platform-Specific
- [ ] Choose deployment platform (Docker/Vercel/Railway/VPS)
- [ ] Platform-specific configuration complete
- [ ] Environment variables set on platform
- [ ] Build command configured
- [ ] Start command configured

### Health Checks
- [ ] Health endpoint accessible (`/api/health`)
- [ ] Database connection verified
- [ ] Application starts without errors
- [ ] All critical features working

## Post-Deployment

### Monitoring
- [ ] Health checks configured
- [ ] Error tracking set up (optional: Sentry)
- [ ] Logging configured
- [ ] Performance monitoring enabled

### Testing
- [ ] Smoke tests passed
- [ ] User authentication working
- [ ] Assessment creation working
- [ ] Results submission working
- [ ] Email notifications working (if configured)

### Documentation
- [ ] Deployment documented
- [ ] Rollback procedure documented
- [ ] Team notified of deployment
- [ ] Changelog updated

## Rollback Plan

If issues occur:
1. [ ] Rollback procedure documented
2. [ ] Database backup available
3. [ ] Previous version tagged in Git
4. [ ] Quick rollback command ready

---

## Quick Commands

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Production build
npm run prod:build

# Test health
curl https://your-domain.com/api/health

# Check logs (Docker)
docker-compose logs -f app

# Check logs (PM2)
pm2 logs assessment-engine
```

---

**Last Updated:** 2025-12-22  
**Version:** 1.0.0
