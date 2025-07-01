#!/bin/bash

# Comprehensive A2A Project Rebuild Script
# This script completely tears down the environment, clears all caches, and rebuilds everything from scratch

set -e

# Save the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
TESTS_DIR="$PROJECT_ROOT/tests"

cd "$PROJECT_ROOT"

echo "🔄 Starting comprehensive rebuild of A2A project..."
echo "📁 Project root: $PROJECT_ROOT"

# Get current timestamp and git commit for build args
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_ID=$(uuidgen 2>/dev/null || echo "rebuild-$(date +%s)")

echo "📅 Build date: $BUILD_DATE"
echo "🔗 VCS ref: $VCS_REF"
echo "🆔 Build ID: $BUILD_ID"

# Step 1: Stop and remove all containers
echo ""
echo "🛑 Step 1: Stopping and removing all containers..."
docker-compose down --remove-orphans --volumes 2>/dev/null || echo "No containers to stop"

# Step 2: Remove all Docker images
echo ""
echo "🗑️  Step 2: Removing all Docker images..."
docker rmi $(docker images -q) 2>/dev/null || echo "No images to remove"

# Step 3: Clear all Docker caches
echo ""
echo "🧹 Step 3: Clearing all Docker caches..."
echo "   Clearing build cache..."
docker builder prune -af
echo "   Clearing system cache..."
docker system prune -af --volumes
echo "   Clearing network cache..."
docker network prune -f

# Step 4: Clear npm caches
echo ""
echo "🧹 Step 4: Clearing npm caches..."
cd a2a-server
npm cache clean --force
cd ../procurement-agent
npm cache clean --force
cd ../finance-agent
npm cache clean --force
cd ..

# Step 5: Remove node_modules and reinstall dependencies
echo ""
echo "📦 Step 5: Reinstalling all dependencies..."
echo "   A2A Server..."
cd a2a-server
rm -rf node_modules package-lock.json
npm install
cd ..

echo "   Procurement Agent..."
cd procurement-agent
rm -rf node_modules package-lock.json
npm install
cd ..

echo "   Finance Agent..."
cd finance-agent
rm -rf node_modules package-lock.json
npm install
cd ..

# Step 6: Verify TypeScript source
echo ""
echo "🔍 Step 6: Verifying TypeScript source..."
cd a2a-server
if [ ! -f "src/server.ts" ]; then
    echo "❌ Error: src/server.ts not found"
    exit 1
fi

if ! grep -q "deploy" src/server.ts; then
    echo "❌ Error: TypeScript source does not contain deployment endpoints"
    exit 1
fi

echo "✅ TypeScript source verified - deployment endpoints found"
cd ..

# Step 7: Build all Docker images
echo ""
echo "🏗️  Step 7: Building all Docker images..."
docker-compose build --no-cache

echo "✅ All Docker images built successfully!"

# Step 8: Start all services
echo ""
echo "🚀 Step 8: Starting all services..."
docker-compose up -d

# Step 9: Wait for services to start
echo ""
echo "⏳ Step 9: Waiting for services to start..."
sleep 20

# Step 10: Wait for Keycloak to be ready
echo ""
echo "🔑 Step 10: Waiting for Keycloak to be ready..."
until curl -s http://localhost:11000/health > /dev/null 2>&1; do
    echo "   Waiting for Keycloak..."
    sleep 5
done
echo "✅ Keycloak is ready!"

# Step 11: Wait for A2A server to be ready
echo ""
echo "⏳ Step 11: Waiting for A2A server to be ready..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    echo "   Waiting for A2A server..."
    sleep 5
done
echo "✅ A2A server is ready!"

# Step 12: Verify the deployment endpoints are available
echo ""
echo "🔍 Step 12: Verifying deployment endpoints..."
if curl -s http://localhost:8000/health | grep -q "protocol_deployment.*true"; then
    echo "✅ Deployment endpoints verified!"
else
    echo "❌ Deployment endpoints not found in health check"
    echo "📋 Container logs:"
    docker-compose logs a2a-server --tail=10
    exit 1
fi

# Step 13: Users automatically provisioned by Keycloak
echo ""
echo "👥 Step 13: Users automatically provisioned by Keycloak via keycloak-provisioning.sh"

# Step 14: Generate test token
echo ""
echo "🎫 Step 14: Generating test token..."
if [ -f "tests/get-token.js" ]; then
    node tests/get-token.js buyer
    echo "✅ Test token generated!"
else
    echo "⚠️  tests/get-token.js not found, skipping token generation"
fi

cd "$PROJECT_ROOT"

# Step 15: Final verification
echo ""
echo "🔍 Step 15: Final verification..."
echo "   Checking A2A server process..."
if docker exec a2a-a2a-server-1 ps aux | grep -q "ts-node src/server.ts"; then
    echo "✅ A2A server running TypeScript directly"
else
    echo "❌ A2A server not running TypeScript directly"
    exit 1
fi

echo "   Checking all services..."
docker-compose ps

echo ""
echo "🎉 Comprehensive rebuild completed successfully!"
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
echo ""
echo "📝 Rebuild Summary:"
echo "   - All containers stopped and removed"
echo "   - All Docker images removed"
echo "   - All caches cleared (Docker, npm)"
echo "   - All dependencies reinstalled"
echo "   - All services rebuilt from scratch"
echo "   - TypeScript running directly (no compilation)"
echo "   - All endpoints verified" 