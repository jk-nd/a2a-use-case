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
docker-compose stop a2a-server buyer-agent seller-agent 2>/dev/null || echo "Some containers may not be running"

# Step 2: Remove only A2A-related containers
echo ""
echo "🗑️  Step 2: Removing A2A-related containers..."
docker-compose rm -f a2a-server buyer-agent seller-agent 2>/dev/null || echo "Some containers may not exist"

# Step 3: Remove only A2A-related Docker images
echo ""
echo "🗑️  Step 3: Removing A2A-related Docker images..."
docker rmi a2a-a2a-server:latest a2a-buyer-agent:latest a2a-seller-agent:latest 2>/dev/null || echo "Some images may not exist"

# Step 4: Clear npm caches for A2A services
echo ""
echo "🧹 Step 4: Clearing npm caches for A2A services..."
cd a2a-server
npm cache clean --force
cd ../buyer-agent
npm cache clean --force
cd ../seller-agent
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

echo "   Buyer Agent..."
cd buyer-agent
rm -rf node_modules package-lock.json
npm install
cd ..

echo "   Seller Agent..."
cd seller-agent
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
docker-compose build --no-cache a2a-server buyer-agent seller-agent

echo "✅ A2A Docker images built successfully!"

# Step 8: Start A2A server first, then agents
echo ""
echo "🚀 Step 8: Starting A2A server first..."
docker-compose up -d a2a-server

# Step 8.5: Wait for A2A server to be ready before starting agents
echo ""
echo "⏳ Step 8.5: Waiting for A2A server to be ready..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    echo "   Waiting for A2A server..."
    sleep 5
done
echo "✅ A2A server is ready!"

# Step 8.6: Start agents after A2A server is ready
echo ""
echo "🤖 Step 8.6: Starting agents..."
docker-compose up -d buyer-agent seller-agent
sleep 10



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
    # Get the token and export it to environment (capture stderr to show progress)
    node scripts/get-technical-token.js >/tmp/technical-token.txt
    export NPL_TECHNICAL_USER_TOKEN=$(cat /tmp/technical-token.txt)
    rm -f /tmp/technical-token.txt
    
    if [ -z "$NPL_TECHNICAL_USER_TOKEN" ]; then
        echo "❌ Failed to capture technical user token"
        exit 1
    fi
    
    echo "✅ Technical user token obtained and environment variable set!"
    echo "Token key ID: $(echo $NPL_TECHNICAL_USER_TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null | jq -r '.kid' 2>/dev/null || echo 'unknown')"
    
    # Restart A2A server with new token
    echo "🔄 Restarting A2A server with new technical token..."
    NPL_TECHNICAL_USER_TOKEN=$NPL_TECHNICAL_USER_TOKEN docker-compose up -d a2a-server
    echo "✅ A2A server restarted with updated token!"
else
    echo "⚠️  scripts/get-technical-token.js not found, skipping technical token generation"
fi

cd "$PROJECT_ROOT"

# Step 12: Final verification
echo ""
echo "🔍 Step 12: Final verification..."
echo "   Waiting for A2A server process to stabilize..."
sleep 5
echo "   Checking A2A server process..."
if docker exec a2a-a2a-server-1 ps aux | grep -q "ts-node.*src/server.ts"; then
    echo "✅ A2A server running TypeScript directly"
else
    echo "❌ A2A server not running TypeScript directly"
    exit 1
fi

echo "   Checking A2A services..."
docker-compose ps a2a-server buyer-agent seller-agent

echo ""
echo "🎉 A2A service rebuild completed successfully!"
echo ""
echo "📊 A2A Service Status:"
echo "   A2A Server: http://localhost:8000"
echo "   Buyer Agent: http://localhost:8001"
echo "   Seller Agent: http://localhost:8002"
echo ""
echo "🔑 Technical user token available in .technical-user-token"
echo "🧪 Run tests with: cd tests && ./run-tests.sh"
echo ""
echo "📝 Rebuild Summary:"
echo "   ✅ A2A Server rebuilt and running"
echo "   ✅ Buyer Agent rebuilt and running"
echo "   ✅ Seller Agent rebuilt and running"
echo "   ✅ NPL Engine, Keycloak, and databases left intact"
echo ""
echo "🚀 Ready for development!" 