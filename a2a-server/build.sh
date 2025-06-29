#!/bin/bash

# A2A Server Build Script
# This script ensures that Docker always picks up the latest changes

set -e

# Change to the a2a-server directory
cd "$(dirname "$0")"

echo "🔨 Building A2A Server with forced rebuild..."

# Get current timestamp and git commit for build args
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_ID=$(uuidgen 2>/dev/null || echo "build-$(date +%s)")

echo "📅 Build date: $BUILD_DATE"
echo "🔗 VCS ref: $VCS_REF"
echo "🆔 Build ID: $BUILD_ID"

# Remove existing image to force complete rebuild
echo "🗑️  Removing existing image..."
docker rmi a2a-server:latest 2>/dev/null || echo "No existing image to remove"

# Clear Docker build cache completely
echo "🧹 Clearing Docker build cache..."
docker builder prune -f

# Build with build args and no cache
echo "🏗️  Building new image..."
docker build \
  --no-cache \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg VCS_REF="$VCS_REF" \
  --build-arg BUILD_ID="$BUILD_ID" \
  -t a2a-server:latest .

echo "✅ Build completed successfully!"
echo "🚀 You can now restart the container with: docker-compose restart a2a-server" 