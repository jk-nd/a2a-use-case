#!/bin/bash

# Simple A2A Server Build Script
# This script builds the A2A server and starts the complete stack with user provisioning

set -e

# Save the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
A2A_SERVER_DIR="$PROJECT_ROOT/a2a-server"
TESTS_DIR="$PROJECT_ROOT/tests"

cd "$PROJECT_ROOT"

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
docker-compose stop a2a-server 2>/dev/null || echo "No container to stop"

# Remove existing image to force complete rebuild
echo "🗑️  Removing existing image..."
docker rmi a2a-a2a-server:latest 2>/dev/null || echo "No existing image to remove"
docker rmi a2a-server:latest 2>/dev/null || echo "No existing image to remove"

# Clear Docker build cache completely
echo "🧹 Clearing Docker build cache..."
docker builder prune -af

# Clear Docker system cache and volumes
echo "🧹 Clearing Docker system cache and volumes..."
docker system prune -f --volumes
echo "   Clearing all volumes..."
docker volume prune -f
echo "   Removing specific project volumes..."
docker volume rm a2a_engine_db_data a2a_keycloak_db_data a2a_postgres_data 2>/dev/null || echo "Some volumes may not exist"

# Install dependencies and verify TypeScript source
echo "🔧 Installing dependencies..."
cd "$A2A_SERVER_DIR"
npm cache clean --force
npm install

# Verify the TypeScript source file exists and has recent content
if [ ! -f "src/server.ts" ]; then
    echo "❌ Error: src/server.ts not found"
    exit 1
fi

# Check if the TypeScript source contains deployment endpoints
if ! grep -q "deploy" src/server.ts; then
    echo "❌ Error: TypeScript source does not contain deployment endpoints"
    exit 1
fi

echo "✅ TypeScript source verified - deployment endpoints found"

# Build with build args and no cache
cd "$PROJECT_ROOT"
echo "🏗️  Building new image..."
docker build \
  --no-cache \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg VCS_REF="$VCS_REF" \
  --build-arg BUILD_ID="$BUILD_ID" \
  -t a2a-server:latest a2a-server

echo "✅ Build completed successfully!"

# Start all services
echo "🚀 Starting complete stack..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Wait for Keycloak to be ready
echo "🔑 Waiting for Keycloak to be ready..."
until curl -s http://localhost:11000/health > /dev/null 2>&1; do
    echo "   Waiting for Keycloak..."
    sleep 5
done
echo "✅ Keycloak is ready!"

# Wait for A2A server to be ready
echo "⏳ Waiting for A2A server to be ready..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    echo "   Waiting for A2A server..."
    sleep 5
done
echo "✅ A2A server is ready!"

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

# Users are automatically provisioned by Keycloak via keycloak-provisioning.sh
echo "👥 Users automatically provisioned by Keycloak via keycloak-provisioning.sh"

# Generate test token
echo "🎫 Generating test token..."
if [ -f "tests/get-token.js" ]; then
    node tests/get-token.js buyer
    echo "✅ Test token generated!"
else
    echo "⚠️  tests/get-token.js not found, skipping token generation"
fi

cd "$PROJECT_ROOT"

echo "🎉 Complete A2A stack build and deployment completed successfully!"
echo ""
echo "📊 Service Status:"
echo "   A2A Server: http://localhost:8000"
echo "   NPL Engine: http://localhost:12000"
echo "   Keycloak: http://localhost:11000"
echo "   Procurement Agent: http://localhost:8001"
echo "   Finance Agent: http://localhost:8002"
echo ""
echo "🔑 Test token available in tests/test-token.txt"
echo "🧪 Run tests with: cd tests && ./run-tests.sh" 