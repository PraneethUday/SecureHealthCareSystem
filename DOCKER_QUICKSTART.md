# 🐳 Docker Quick Start Guide

## ✅ Verified Working Setup

This Docker configuration has been tested and verified working on **February 9, 2026**.

## 📋 Prerequisites

- Docker Engine 20.10+ installed and running
- Docker Compose 2.0+ (optional, for easier deployment)
- `.env` file configured with your Supabase credentials

## 🚀 Quick Start Options

### Option 1: Using the Automated Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x docker-build.sh

# Build and run
./docker-build.sh
```

The script will:
- ✅ Validate your `.env` file
- 📦 Build the Docker image
- 🚀 Start the container
- 🔍 Wait for health check
- 📊 Show useful management commands

### Option 2: Using Docker Compose

```bash
# Make the script executable (first time only)
chmod +x docker-compose-up.sh

# Build and run with Docker Compose
./docker-compose-up.sh
```

Or manually:

```bash
docker-compose up -d --build
```

### Option 3: Manual Docker Commands

```bash
# Load environment variables
source .env

# Build the image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -t secure-healthcare:latest \
  .

# Run the container
docker run -d \
  --name secure-healthcare \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  secure-healthcare:latest
```

## 🔍 Verify Deployment

Once the container is running, test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-09T16:46:10.189Z",
  "uptime": 18.303303007
}
```

Access the application at: **http://localhost:3000**

## 📊 Container Management

### View Logs

```bash
# Docker
docker logs -f secure-healthcare

# Docker Compose
docker-compose logs -f
```

### Stop the Application

```bash
# Docker
docker stop secure-healthcare

# Docker Compose
docker-compose down
```

### Restart the Application

```bash
# Docker
docker restart secure-healthcare

# Docker Compose
docker-compose restart
```

### Remove Container

```bash
# Docker
docker stop secure-healthcare
docker rm secure-healthcare

# Docker Compose
docker-compose down -v
```

## 🏗️ Image Details

- **Base Image**: `node:20-alpine`
- **Size**: ~304MB
- **Build Type**: Multi-stage (optimized for production)
- **User**: Non-root user (nextjs:nodejs)
- **Port**: 3000
- **Health Check**: Built-in at `/api/health`

## 🔧 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
docker run -d --name secure-healthcare -p 8080:3000 --env-file .env secure-healthcare:latest
```

### Build Failures

If the build fails:

1. Ensure `.env` file exists and contains valid values
2. Check Docker daemon is running: `docker ps`
3. Clean up and rebuild:

```bash
docker system prune -a
docker build --no-cache -t secure-healthcare:latest .
```

### Container Won't Start

Check logs for errors:

```bash
docker logs secure-healthcare
```

Common issues:
- Missing environment variables in `.env`
- Invalid Supabase credentials
- Port conflicts

## 🔐 Security Notes

- Container runs as non-root user (UID 1001)
- Uses multi-stage builds to exclude dev dependencies
- No sensitive data in image layers
- Environment variables loaded at runtime only

## 📦 Image Layers

The Dockerfile uses a 3-stage build:

1. **deps**: Installs all dependencies
2. **builder**: Builds the Next.js application
3. **runner**: Minimal production image with only runtime files

## 🌐 Production Deployment

For production deployments:

1. Use proper secrets management (not `.env` files)
2. Configure proper NEXTAUTH_URL for your domain
3. Set up reverse proxy (nginx/caddy) with SSL
4. Use Docker secrets or AWS/GCP secret managers
5. Configure proper health checks and monitoring

## ✅ Verified Configuration

This setup includes:
- ✅ Next.js 15.1.6 with standalone output
- ✅ Health check endpoint at `/api/health`
- ✅ Optimized multi-stage build
- ✅ Security hardening with non-root user
- ✅ Automatic restarts with `unless-stopped` policy
- ✅ Comprehensive logging
- ✅ Docker Compose support

## 📝 Notes

- The `public` directory is automatically created if not present
- Build arguments are used for Next.js public environment variables
- Runtime environment variables are loaded from `.env`
- Container automatically restarts unless manually stopped
- Health check runs every 30 seconds after 40s startup period

## 🎯 Next Steps

After successful deployment:

1. Access the application at http://localhost:3000
2. Log in with your credentials
3. Check the logs: `docker logs -f secure-healthcare`
4. Monitor resource usage: `docker stats secure-healthcare`

For more details, see [DOCKER.md](./DOCKER.md) for comprehensive documentation.
