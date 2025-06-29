#!/bin/bash

# Simple Development Script for A2A Server
# This script compiles TypeScript locally and copies to container

set -e

echo "🚀 Starting A2A Server in Simple Development Mode..."

# Change to the a2a-server directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the a2a-server directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Compiling TypeScript..."
npm run build

# Verify compilation worked
if [ ! -f "dist/server.js" ]; then
    echo "❌ Error: dist/server.js not found after compilation"
    exit 1
fi

# Check if deployment endpoints are in the compiled file
if ! grep -q "deploy" dist/server.js; then
    echo "❌ Error: Compiled server.js does not contain deployment endpoints"
    exit 1
fi

echo "✅ TypeScript compilation successful"

# Copy missing JavaScript files to dist directory
echo "📋 Copying additional JavaScript files..."
cp src/agent-skills.js dist/ 2>/dev/null || echo "agent-skills.js not found"
cp src/method-handlers.js dist/ 2>/dev/null || echo "method-handlers.js not found"
cp src/method-mappings.js dist/ 2>/dev/null || echo "method-mappings.js not found"

# Copy compiled file to container
echo "📋 Copying compiled files to container..."
cd ..
docker cp a2a-server/dist/ a2a-a2a-server-1:/app/

# Restart container
echo "🔄 Restarting container..."
docker-compose restart a2a-server

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Verify deployment endpoints
echo "🔍 Verifying deployment endpoints..."
if curl -s http://localhost:8000/health | grep -q "protocol_deployment.*true"; then
    echo "✅ Deployment endpoints verified!"
else
    echo "❌ Deployment endpoints not found"
    echo "📋 Container logs:"
    docker-compose logs a2a-server --tail=10
    exit 1
fi

echo "🎉 A2A Server development mode started successfully!"
echo "📝 Code changes:"
echo "   1. Edit src/server.ts"
echo "   2. Run: cd a2a-server && npm run build"
echo "   3. Run: docker cp a2a-server/dist/ a2a-a2a-server-1:/app/"
echo "   4. Run: docker-compose restart a2a-server" 