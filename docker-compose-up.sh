#!/bin/bash

# Docker Compose Build and Run Script for Secure Healthcare System
# This script uses docker-compose for easier deployment

set -e

echo "🏥 Secure Healthcare System - Docker Compose Deployment"
echo "======================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your configuration:"
    echo "  cp .env.example .env"
    exit 1
fi

# Check required variables
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Required environment variables are missing!"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Build and start with docker-compose
echo "📦 Building and starting services with Docker Compose..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Services started successfully!"
    echo ""
    echo "🌐 Application is available at: http://localhost:3000"
    echo ""
    echo "📊 Useful commands:"
    echo "  View logs:     docker-compose logs -f"
    echo "  Stop:          docker-compose down"
    echo "  Restart:       docker-compose restart"
    echo "  Status:        docker-compose ps"
    echo ""
    echo "⏳ Waiting for application to be healthy..."
    
    # Wait for health check
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Application is healthy and ready!"
            exit 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo ""
    echo "⚠️  Health check timeout. Check logs with: docker-compose logs"
else
    echo "❌ Failed to start services!"
    exit 1
fi
