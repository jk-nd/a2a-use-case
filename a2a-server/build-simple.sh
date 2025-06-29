#!/bin/bash

# Simple A2A Server Build Script
# This script builds the A2A server without complex directory navigation

set -e

echo "🔨 Building A2A Server (Simple Mode)..."

# Get current timestamp and git commit for build args
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_ID=$(uuidgen 2>/dev/null || echo "build-$(date +%s)")

echo "📅 Build date: $BUILD_DATE"
echo "🔗 VCS ref: $VCS_REF"
echo "🆔 Build ID: $BUILD_ID"

# Stop and remove existing container
echo "🛑 Stopping existing container..."
cd ..
docker-compose stop a2a-server 2>/dev/null || echo "No container to stop"
cd a2a-server

# Remove existing image to force complete rebuild
echo "🗑️  Removing existing image..."
docker rmi a2a-a2a-server:latest 2>/dev/null || echo "No existing image to remove"
docker rmi a2a-server:latest 2>/dev/null || echo "No existing image to remove"

# Clear Docker build cache completely
echo "🧹 Clearing Docker build cache..."
docker builder prune -af

# Clear Docker system cache
echo "🧹 Clearing Docker system cache..."
docker system prune -f

# Force TypeScript compilation locally first
echo "🔧 Compiling TypeScript locally..."
npm cache clean --force
npm install
npm run build

# Verify the compiled file exists and has recent content
if [ ! -f "dist/server.js" ]; then
    echo "❌ Error: dist/server.js not found after compilation"
    exit 1
fi

# Check if the compiled file contains deployment endpoints
if ! grep -q "deploy" dist/server.js; then
    echo "❌ Error: Compiled server.js does not contain deployment endpoints"
    echo "📝 Checking TypeScript source..."
    if grep -q "deploy" src/server.ts; then
        echo "✅ Deployment endpoints found in TypeScript source"
        echo "❌ But not in compiled JavaScript - compilation issue"
    else
        echo "❌ Deployment endpoints not found in TypeScript source either"
    fi
    exit 1
fi

echo "✅ TypeScript compilation successful - deployment endpoints found"

# Copy missing JavaScript files to dist directory
echo "📋 Copying additional JavaScript files..."
cp src/agent-skills.js dist/ 2>/dev/null || echo "agent-skills.js not found"
cp src/method-handlers.js dist/ 2>/dev/null || echo "method-handlers.js not found"
cp src/method-mappings.js dist/ 2>/dev/null || echo "method-mappings.js not found"

# Build with build args and no cache
echo "🏗️  Building new image..."
docker build \
  --no-cache \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg VCS_REF="$VCS_REF" \
  --build-arg BUILD_ID="$BUILD_ID" \
  -t a2a-server:latest .

echo "✅ Build completed successfully!"

# Start the container
echo "🚀 Starting container..."
cd ..
docker-compose up -d a2a-server

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Verify the deployment endpoints are available
echo "🔍 Verifying deployment endpoints..."
if curl -s http://localhost:8000/health | grep -q "protocol_deployment.*true"; then
    echo "✅ Deployment endpoints verified!"
else
    echo "❌ Deployment endpoints not found in health check"
    echo "📋 Container logs:"
    docker-compose logs a2a-server --tail=10
    exit 1
fi

echo "🎉 A2A Server build and deployment completed successfully!" 