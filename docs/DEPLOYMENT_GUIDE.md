# Deployment Guide

## Overview

This guide covers deploying the Secure Healthcare System to production. The application can be deployed to various platforms including Vercel, AWS, or self-hosted environments.

## Prerequisites

- Node.js 18.x or later
- Supabase account and project
- Domain name (recommended for production)
- SSL certificate (required for WebRTC)

## Environment Setup

### 1. Environment Variables

Create a `.env.production` file:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Optional: TURN Server for WebRTC
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=turn-username
NEXT_PUBLIC_TURN_PASSWORD=turn-password
```

### 2. Database Configuration

#### Supabase Setup

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create new project
   - Note your project URL and API keys

2. **Run Database Migrations**
   ```bash
   # Connect to Supabase
   npx supabase login
   
   # Link your project
   npx supabase link --project-ref your-project-ref
   
   # Run migrations
   npx supabase db push
   ```

3. **Enable Realtime**
   
   Via Dashboard:
   - Navigate to Database → Replication
   - Enable realtime for:
     - `video_calls`
     - `video_call_signaling`
   
   Or via SQL:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;
   ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;
   ```

4. **Configure Row Level Security (RLS)**
   
   Ensure RLS policies are in place:
   ```sql
   -- See supabase/schema.sql for complete RLS policies
   ```

## Deployment Platforms

### Option 1: Vercel (Recommended)

Vercel provides seamless Next.js deployment with automatic SSL.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.production`

5. **Configure Domain**
   - Settings → Domains → Add your custom domain
   - Update DNS records as instructed

#### Vercel Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Option 2: Docker Deployment

For self-hosted deployments or cloud platforms.

#### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build image
docker build -t healthcare-system .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  healthcare-system

# Or use Docker Compose
docker-compose up -d
```

### Option 3: AWS Deployment

Deploy to AWS using Elastic Beanstalk or ECS.

#### AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   eb init -p node.js-18 healthcare-system
   ```

3. **Create Environment**
   ```bash
   eb create healthcare-prod
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv NEXT_PUBLIC_SUPABASE_URL=your-url \
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

## SSL/TLS Configuration

**Critical**: WebRTC requires HTTPS in production.

### Using Vercel
SSL is automatic with Vercel.

### Using Let's Encrypt (Self-hosted)

```bash
# Install Certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificate location:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Nginx Configuration

Create `/etc/nginx/sites-available/healthcare`:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/healthcare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Performance Optimization

### 1. Build Optimization

Update `next.config.ts`:
```typescript
const config: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable SWC minification
  swcMinify: true,
};
```

### 2. Caching Strategy

Configure caching headers:
```typescript
// next.config.ts
const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 3. Database Optimization

- Add indexes on frequently queried columns
- Use connection pooling
- Enable query result caching

```sql
-- Add indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_video_calls_status ON video_calls(status);
```

## Monitoring & Logging

### 1. Application Monitoring

Recommended tools:
- **Vercel Analytics**: Built-in for Vercel deployments
- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Full-stack monitoring

#### Sentry Setup

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Log Management

Configure structured logging:
```typescript
// lib/logging.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date() }));
  },
  error: (message: string, error: Error, meta?: any) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error.message, 
      stack: error.stack,
      ...meta, 
      timestamp: new Date() 
    }));
  },
};
```

### 3. Health Checks

Create health check endpoint:
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check database connection
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) throw error;
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        application: 'up'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error.message 
    }, { status: 503 });
  }
}
```

## Security Hardening

### 1. Security Headers

Add security headers in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
      ],
    },
  ];
}
```

### 2. Rate Limiting

Implement rate limiting for APIs:
```typescript
// lib/rate-limit.ts
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
});

export async function checkRateLimit() {
  const allowed = await limiter.removeTokens(1);
  return allowed >= 0;
}
```

### 3. Input Sanitization

Always sanitize user input:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}
```

## Backup Strategy

### Database Backups

Supabase provides automatic daily backups. For additional protection:

```bash
# Manual backup
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        > backup-$(date +%Y%m%d).sql

# Restore backup
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     < backup-20260111.sql
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups"
DB_HOST="db.your-project.supabase.co"

pg_dump -h $DB_HOST -U postgres -d postgres | \
  gzip > $BACKUP_DIR/backup-$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

## Scaling Considerations

### Horizontal Scaling

For high traffic:
1. **Load Balancer**: Distribute traffic across multiple instances
2. **CDN**: Use CloudFlare or AWS CloudFront for static assets
3. **Database Pooling**: Use PgBouncer for connection pooling

### Vertical Scaling

Upgrade resources as needed:
- Increase server memory for Node.js
- Use larger database instance
- Upgrade Supabase plan for more concurrent connections

## Rollback Strategy

### Version Control

Tag releases:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Quick Rollback

Vercel:
```bash
vercel rollback
```

Docker:
```bash
docker pull healthcare-system:previous-tag
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test user registration and login
- [ ] Test video call functionality
- [ ] Verify Supabase Realtime is enabled
- [ ] Check SSL certificate is valid
- [ ] Test on multiple browsers
- [ ] Verify mobile responsiveness
- [ ] Check performance metrics
- [ ] Test error handling
- [ ] Verify backup system is running
- [ ] Set up monitoring alerts
- [ ] Review security headers
- [ ] Test health check endpoint
- [ ] Document any custom configuration

## Troubleshooting

### Issue: "WebRTC not working in production"
- Verify HTTPS is enabled
- Check TURN server configuration
- Test with different networks

### Issue: "Realtime not working"
- Verify Supabase Realtime is enabled for tables
- Check API keys are correct
- Verify network allows WebSocket connections

### Issue: "Slow page loads"
- Enable CDN
- Optimize images
- Check database query performance
- Review bundle size

## Support

For deployment issues:
- Vercel: [Vercel Support](https://vercel.com/support)
- Supabase: [Supabase Support](https://supabase.com/support)
- Community: [GitHub Discussions](your-repo/discussions)
