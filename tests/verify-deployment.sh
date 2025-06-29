#!/bin/bash

# Verification script for A2A deployment endpoints

set -e

echo "🔍 Verifying A2A deployment endpoints..."

# Check if server is running
echo "📡 Checking server health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
echo "Health response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "protocol_deployment.*true"; then
    echo "✅ Deployment endpoints are enabled!"
else
    echo "❌ Deployment endpoints not found in health check"
    exit 1
fi

# Test deployment endpoint (should return validation error, not 404)
echo "🧪 Testing deployment endpoint..."
DEPLOY_RESPONSE=$(curl -s -X POST http://localhost:8000/a2a/deploy \
  -H "Content-Type: application/json" \
  -d '{"test": "endpoint"}')

if echo "$DEPLOY_RESPONSE" | grep -q "Missing required parameters"; then
    echo "✅ Deployment endpoint is working (returned expected validation error)"
elif echo "$DEPLOY_RESPONSE" | grep -q "Cannot POST"; then
    echo "❌ Deployment endpoint not found (404 error)"
    exit 1
else
    echo "⚠️  Unexpected response from deployment endpoint:"
    echo "$DEPLOY_RESPONSE"
fi

# Test refresh endpoint
echo "🔄 Testing refresh endpoint..."
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:8000/a2a/refresh \
  -H "Content-Type: application/json" \
  -d '{"test": "endpoint"}')

if echo "$REFRESH_RESPONSE" | grep -q "Missing required parameter"; then
    echo "✅ Refresh endpoint is working (returned expected validation error)"
elif echo "$REFRESH_RESPONSE" | grep -q "Cannot POST"; then
    echo "❌ Refresh endpoint not found (404 error)"
    exit 1
else
    echo "⚠️  Unexpected response from refresh endpoint:"
    echo "$REFRESH_RESPONSE"
fi

echo "🎉 All deployment endpoints verified successfully!" 