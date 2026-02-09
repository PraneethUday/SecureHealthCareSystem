#!/bin/bash

# Docker Build and Run Script for Secure Healthcare System
# This script builds the Docker image and runs the container

set -e

echo "🏥 Secure Healthcare System - Docker Deployment"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your configuration:"
    echo "  cp .env.example .env"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Required environment variables are missing!"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Build the Docker image
echo "📦 Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -t secure-healthcare:latest \
  .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
else
    echo "❌ Docker build failed!"
    exit 1
fi

echo ""

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=secure-healthcare)" ]; then
    echo "🛑 Stopping existing container..."
    docker stop secure-healthcare 2>/dev/null || true
    docker rm secure-healthcare 2>/dev/null || true
    echo "✅ Existing container removed"
    echo ""
fi

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name secure-healthcare \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  secure-healthcare:latest

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully!"
    echo ""
    echo "🌐 Application is available at: http://localhost:3000"
    echo ""
    echo "📊 Useful commands:"
    echo "  View logs:     docker logs -f secure-healthcare"
    echo "  Stop:          docker stop secure-healthcare"
    echo "  Restart:       docker restart secure-healthcare"
    echo "  Remove:        docker rm -f secure-healthcare"
    echo ""
    echo "⏳ Waiting for application to be healthy..."
    
    # Wait for health check
    for i in {1..30}; do
        if docker exec secure-healthcare node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; then
            echo "✅ Application is healthy and ready!"
            exit 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo ""
    echo "⚠️  Health check timeout. Check logs with: docker logs secure-healthcare"
else
    echo "❌ Failed to start container!"
    exit 1
fi
