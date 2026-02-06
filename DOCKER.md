# Docker Deployment Guide

## Overview

This guide explains how to build and run the Secure Healthcare System using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+ (optional, for easier deployment)
- `.env` file with required environment variables

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Copy environment variables:**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values.

2. **Build and run:**

   ```bash
   docker-compose up -d
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the image:**

   ```bash
   docker build -t secure-healthcare:latest \
     --build-arg NEXT_PUBLIC_SUPABASE_URL="your-supabase-url" \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
     .
   ```

   Or load from .env file:

   ```bash
   source .env
   docker build -t secure-healthcare:latest \
     --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
     .
   ```

2. **Run the container:**

   ```bash
   docker run -d \
     --name secure-healthcare \
     -p 3000:3000 \
     --env-file .env \
     secure-healthcare:latest
   ```

3. **View logs:**

   ```bash
   docker logs -f secure-healthcare
   ```

4. **Stop the container:**
   ```bash
   docker stop secure-healthcare
   docker rm secure-healthcare
   ```

## Image Details

### Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **deps**: Installs production dependencies only
2. **builder**: Builds the Next.js application
3. **runner**: Creates the final production image

### Image Size Optimization

- Uses `node:20-alpine` base image for smaller footprint
- Only includes production dependencies and built assets
- Excludes development files and tests

### Security Features

- Runs as non-root user (`nextjs:nodejs`)
- Minimal attack surface with alpine base
- No development dependencies in production

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_HOST`, `EMAIL_PORT` - Email configuration
- `OPENAI_API_KEY` - OpenAI API key for chatbot

## Health Check

The application includes a health check endpoint that runs every 30 seconds:

```bash
curl http://localhost:3000/api/health
```

## Troubleshooting

### Build Arguments Required

Next.js requires `NEXT_PUBLIC_*` environment variables at build time. Always provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are embedded in the client-side JavaScript bundle during build.

### Build Errors

- Ensure all dependencies in `package.json` are compatible
- Check that `output: 'standalone'` is set in `next.config.ts`

### Runtime Errors

- Verify all environment variables are set correctly
- Check logs: `docker logs secure-healthcare`
- Ensure Supabase connection is working

### Port Conflicts

If port 3000 is already in use:

```bash
# Docker Compose: Edit docker-compose.yml
ports:
  - "3001:3000"  # Change host port

# Docker CLI: Use -p flag
docker run -p 3001:3000 ...
```

## Production Deployment

### Building for Production

```bash
docker build --target runner -t secure-healthcare:prod .
```

### Using a Registry

```bash
# Tag the image
docker tag secure-healthcare:latest your-registry/secure-healthcare:latest

# Push to registry
docker push your-registry/secure-healthcare:latest

# Pull and run on server
docker pull your-registry/secure-healthcare:latest
docker run -d -p 3000:3000 --env-file .env your-registry/secure-healthcare:latest
```

## Development

For local development, it's recommended to use:

```bash
npm run dev
```

Docker is optimized for production deployments.

## Support

For issues or questions, refer to:

- [Project README](README.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Setup Instructions](docs/SETUP_INSTRUCTIONS.md)
