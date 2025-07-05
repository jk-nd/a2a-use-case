#!/bin/bash

# A2A Service Only Rebuild Script
# This script rebuilds only the A2A service and related components, leaving NPL engine, Keycloak, etc. intact

set -e

# Save the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

cd "$PROJECT_ROOT"

echo "🔄 Starting A2A service only rebuild..."
echo "📁 Project root: $PROJECT_ROOT"

# Get current timestamp and git commit for build args
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_ID=$(uuidgen 2>/dev/null || echo "rebuild-$(date +%s)")

echo "📅 Build date: $BUILD_DATE"
echo "🔗 VCS ref: $VCS_REF"
echo "🆔 Build ID: $BUILD_ID"

# Step 1: Stop only A2A-related containers
echo ""
echo "🛑 Step 1: Stopping A2A-related containers..."
docker-compose stop a2a-server procurement-agent finance-agent 2>/dev/null || echo "Some containers may not be running"

# Step 2: Remove only A2A-related containers
echo ""
echo "🗑️  Step 2: Removing A2A-related containers..."
docker-compose rm -f a2a-server procurement-agent finance-agent 2>/dev/null || echo "Some containers may not exist"

# Step 3: Remove only A2A-related Docker images
echo ""
echo "🗑️  Step 3: Removing A2A-related Docker images..."
docker rmi a2a-a2a-server:latest a2a-procurement-agent:latest a2a-finance-agent:latest 2>/dev/null || echo "Some images may not exist"

# Step 4: Clear npm caches for A2A services
echo ""
echo "🧹 Step 4: Clearing npm caches for A2A services..."
cd a2a-server
npm cache clean --force
cd ../procurement-agent
npm cache clean --force
cd ../finance-agent
npm cache clean --force
cd ..

# Step 5: Remove node_modules and reinstall dependencies for A2A services
echo ""
echo "📦 Step 5: Reinstalling A2A service dependencies..."
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

# Step 7: Build only A2A-related Docker images
echo ""
echo "🏗️  Step 7: Building A2A-related Docker images..."
docker-compose build --no-cache a2a-server procurement-agent finance-agent

echo "✅ A2A Docker images built successfully!"

# Step 8: Start only A2A-related services
echo ""
echo "🚀 Step 8: Starting A2A-related services..."
docker-compose up -d a2a-server procurement-agent finance-agent

# Step 9: Wait for A2A server to be ready
echo ""
echo "⏳ Step 9: Waiting for A2A server to be ready..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    echo "   Waiting for A2A server..."
    sleep 5
done
echo "✅ A2A server is ready!"

# Step 10: Verify the deployment endpoints are available
echo ""
echo "🔍 Step 10: Verifying deployment endpoints..."
if curl -s http://localhost:8000/health | grep -q "protocol_deployment.*true"; then
    echo "✅ Deployment endpoints verified!"
else
    echo "❌ Deployment endpoints not found in health check"
    echo "📋 Container logs:"
    docker-compose logs a2a-server --tail=10
    exit 1
fi

# Step 11: Get technical user token for A2A server
echo ""
echo "🔑 Step 11: Getting technical user token for A2A server..."
if [ -f "scripts/get-technical-token.js" ]; then
    node scripts/get-technical-token.js
    echo "✅ Technical user token obtained and environment variable set!"
else
    echo "⚠️  scripts/get-technical-token.js not found, skipping technical token generation"
fi

cd "$PROJECT_ROOT"

# Step 12: Final verification
echo ""
echo "🔍 Step 12: Final verification..."
echo "   Checking A2A server process..."
if docker exec a2a-a2a-server-1 ps aux | grep -q "ts-node src/server.ts"; then
    echo "✅ A2A server running TypeScript directly"
else
    echo "❌ A2A server not running TypeScript directly"
    exit 1
fi

echo "   Checking A2A services..."
docker-compose ps a2a-server procurement-agent finance-agent

echo ""
echo "🎉 A2A service rebuild completed successfully!"
echo ""
echo "📊 A2A Service Status:"
echo "   A2A Server: http://localhost:8000"
echo "   Procurement Agent: http://localhost:8001"
echo "   Finance Agent: http://localhost:8002"
echo ""
echo "🔑 Technical user token available in .technical-user-token"
echo "🧪 Run tests with: cd tests && ./run-tests.sh"
echo ""
echo "📝 Rebuild Summary:"
echo "   ✅ A2A Server rebuilt and running"
echo "   ✅ Procurement Agent rebuilt and running"
echo "   ✅ Finance Agent rebuilt and running"
echo "   ✅ NPL Engine, Keycloak, and databases left intact"
echo ""
echo "🚀 Ready for development!" 