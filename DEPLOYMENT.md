# Deployment Guide

This guide covers deploying the Political Sentiment Tracker to Heroku with PostgreSQL and Redis.

## Prerequisites

- Heroku CLI installed
- Git repository connected to Heroku
- API keys for external services

## Quick Deploy

### 1. Create Heroku App

```bash
heroku create your-app-name
```

### 2. Add Add-ons

```bash
# PostgreSQL database
heroku addons:create heroku-postgresql:hobby-dev

# Redis cache
heroku addons:create heroku-redis:hobby-dev

# Scheduler (optional)
heroku addons:create scheduler:standard
```

### 3. Set Environment Variables

```bash
heroku config:set NEWS_API_KEY=your_newsapi_key
heroku config:set ADMIN_PASSWORD=your_secure_password
heroku config:set SESSION_SECRET=your_session_secret
heroku config:set NODE_ENV=production
```

### 4. Deploy

```bash
git push heroku main
```

### 5. Run Migrations

```bash
heroku run npm run migrate
```

### 6. Setup Scheduler (Optional)

```bash
heroku addons:open scheduler

# Add job:
# Command: node scripts/fetchMetrics.js
# Frequency: Daily at 02:00 UTC
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (auto-set) | `postgresql://...` |
| `REDIS_URL` | Redis connection (auto-set) | `redis://...` |
| `ADMIN_PASSWORD` | Admin login password | `your_secure_password` |
| `SESSION_SECRET` | Session encryption key | `random_string_here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEWS_API_KEY` | NewsAPI.org API key | None (no news data) |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Build Process

The app uses a monorepo structure with the following build process:

1. **Install Dependencies**: `npm install` in root
2. **Build Frontend**: `cd frontend && npm install && npm run build`
3. **Copy Build**: Frontend build copied to `backend/public/`
4. **Start Server**: `node backend/server.js`

This is handled by the `heroku-postbuild` script in `package.json`.

## Database Setup

The app will automatically:
1. Create database tables on first run
2. Seed with sample candidate data
3. Run migrations as needed

Manual migration:
```bash
heroku run npm run migrate
```

## Monitoring

### Logs
```bash
heroku logs --tail
heroku logs --ps scheduler  # Scheduler logs
```

### Scaling
```bash
heroku ps:scale web=1  # Scale web dynos
```

### Add-on Status
```bash
heroku addons
heroku addons:open heroku-postgresql
heroku addons:open heroku-redis
```

## Performance Tips

1. **Enable Redis Caching**: Set `REDIS_URL` for better performance
2. **Use Compression**: Already enabled in Express
3. **Set up CDN**: Consider Cloudflare for static assets
4. **Monitor Memory**: Watch dyno memory usage

## Security Checklist

- [ ] Set strong `ADMIN_PASSWORD`
- [ ] Use secure `SESSION_SECRET`
- [ ] Keep API keys secret
- [ ] Enable HTTPS (automatic on Heroku)
- [ ] Set `NODE_ENV=production`

## Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check dependencies
npm run install-deps

# Check build locally
npm run build
```

**Database Connection**
```bash
# Check DATABASE_URL
heroku config:get DATABASE_URL

# Run migration manually
heroku run npm run migrate
```

**Redis Connection**
```bash
# Check Redis URL
heroku config:get REDIS_URL

# Redis is optional - app works without it
```

**API Keys**
```bash
# News API issues
heroku config:get NEWS_API_KEY

# App works without NEWS_API_KEY (no news data)
```

### Performance Issues

1. Check dyno metrics in Heroku dashboard
2. Monitor database performance
3. Check Redis hit rates
4. Review application logs

## Backup & Recovery

### Database Backup
```bash
# Create backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download
```

### Config Backup
```bash
# Export config
heroku config --shell > .env.production
```

## Alternative Deployment

### Docker (Optional)
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

### Other Platforms

The app can also be deployed to:
- **Railway**: Similar to Heroku with PostgreSQL
- **Render**: Free tier with PostgreSQL
- **DigitalOcean App Platform**: Container deployment
- **AWS Elastic Beanstalk**: With RDS and ElastiCache

## Maintenance

### Regular Tasks

1. **Monitor logs** for errors
2. **Check database size** (Heroku hobby has 10K row limit)
3. **Clean old data** using admin cleanup feature
4. **Update dependencies** regularly
5. **Monitor API rate limits**

### Scheduled Maintenance

The app includes automatic cleanup via the admin panel:
- Remove old metrics (configurable retention)
- Clean expired sessions
- Archive old vote data

Access via: `/admin` → Cleanup section