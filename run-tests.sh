#!/bin/bash

# Test runner script for A2A project
# This script runs tests from the tests directory

set -e

echo "🧪 Running A2A project tests..."

# Check if tests directory exists
if [ ! -d "tests" ]; then
    echo "❌ Tests directory not found"
    exit 1
fi

# Change to tests directory and run tests
cd tests

# Make sure all scripts are executable
chmod +x *.sh 2>/dev/null || true

# Run the main test suite
echo "🚀 Starting test suite..."
node run-tests.js

echo "✅ All tests completed!" 