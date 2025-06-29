#!/bin/bash

# A2A Server Development Script
# This script runs the A2A server in development mode with volume mounts

set -e

echo "🚀 Starting A2A Server in Development Mode..."

# Change to the a2a-server directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the a2a-server directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Starting development server with volume mounts..."

# Run with docker-compose using development overrides
cd ..
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up a2a-server

echo "✅ Development server started!"
echo "📝 Code changes will be automatically reloaded."
echo "🛑 Press Ctrl+C to stop the server." 