# A2A Project Scripts

This directory contains build and deployment scripts for the A2A project.

## Available Scripts

### `build.sh`
**Purpose**: Standard build script for the A2A server and complete stack

**What it does**:
- Stops existing containers
- Removes old Docker images
- Clears Docker build cache
- Installs dependencies and verifies TypeScript source
- Builds Docker images with no cache
- Starts all services
- Waits for services to be ready
- Verifies deployment endpoints
- Runs user provisioning
- Generates test token

**Usage**:
```bash
./scripts/build.sh
```

### `rebuild.sh`
**Purpose**: Comprehensive rebuild that completely tears down the environment and rebuilds everything from scratch

**What it does**:
- Stops and removes ALL containers with volumes
- Removes ALL Docker images
- Clears ALL Docker caches (build, system, network)
- Clears ALL npm caches
- Removes and reinstalls ALL node_modules
- Verifies TypeScript source
- Builds ALL Docker images from scratch
- Starts all services
- Comprehensive verification and testing
- User provisioning and token generation

**Usage**:
```bash
./scripts/rebuild.sh
```

### `rebuild-a2a-only.sh` ⭐ **RECOMMENDED**
**Purpose**: Lightweight rebuild focused on A2A server changes only

**What it does**:
- Stops and removes A2A-related containers (A2A server, agents)
- Removes A2A-related Docker images
- Clears A2A npm caches
- Reinstalls A2A dependencies
- Verifies TypeScript source
- Builds A2A Docker images from scratch
- Starts A2A services
- Verifies A2A server endpoints
- **Preserves core services** (NPL Engine, Keycloak, databases)
- **Fixed process detection** - Proper TypeScript process verification
- **Optimized timing** - Includes delays for container stabilization

**Usage**:
```bash
./scripts/rebuild-a2a-only.sh
```

**When to use**: Perfect for A2A server development when you don't need to rebuild the entire stack. **Most common development scenario.**

### `get-technical-token.js`
**Purpose**: Generate technical user token for NPL engine access

**What it does**:
- Authenticates with Keycloak
- Retrieves technical user token
- Outputs token for use in API calls
- Supports engine clearing operations

**Usage**:
```bash
node scripts/get-technical-token.js
```

**Output**:
```bash
NPL_TECHNICAL_USER_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

## When to Use Each Script

### Use `build.sh` when:
- Making incremental changes to the code
- Need a quick rebuild after code changes
- Want to preserve some Docker layers for faster builds
- Regular development workflow

### Use `rebuild.sh` when:
- Experiencing Docker cache issues
- Want to ensure a completely clean environment
- After major dependency changes
- Troubleshooting build problems
- Need to verify everything works from scratch
- Before important demos or deployments

### Use `rebuild-a2a-only.sh` when: ⭐ **RECOMMENDED**
- Making changes to A2A server code only
- Want fast rebuilds during development
- Other services (NPL Engine, Keycloak) are working fine
- Testing A2A server changes quickly
- **Most common development scenario**

## Engine State Management

### Clearing Engine State
For clean testing, you can clear the NPL engine state:

```bash
# Get technical token
TOKEN=$(node scripts/get-technical-token.js | grep NPL_TECHNICAL_USER_TOKEN | cut -d'=' -f2)

# Clear engine state
curl -X DELETE http://localhost:12400/management/application/contents \
  -H "Authorization: Bearer $TOKEN"

# Verify clean state
curl http://localhost:8000/a2a/skills
# Returns: [] (empty - no protocols deployed)
```

### Automated Engine Clearing
The test runner automatically clears the engine before running tests:

```bash
# Run tests with automatic engine clearing
cd tests && node run-tests.js
```

## Script Features

All scripts include:
- ✅ **Error handling**: Scripts exit on any error
- ✅ **Progress indicators**: Clear step-by-step progress
- ✅ **Verification**: Multiple health checks and validations
- ✅ **User provisioning**: Automatic user and token setup
- ✅ **Service status**: Final status report with URLs
- ✅ **TypeScript verification**: Ensures latest code is running

### Additional Features in `rebuild-a2a-only.sh`:
- ✅ **Fast rebuild**: Only rebuilds A2A server, preserves other services
- ✅ **Service preservation**: Keeps NPL Engine and Keycloak running
- ✅ **Development optimized**: Perfect for iterative development
- ✅ **Minimal disruption**: Other services remain available during rebuild

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm available
- Internet connection for pulling base images
- Sufficient disk space for Docker images

## Troubleshooting

### If scripts fail:
1. Check Docker is running
2. Ensure sufficient disk space
3. Try `rebuild.sh` for a complete clean rebuild
4. Check container logs: `docker-compose logs <service-name>`

### Common Issues:

#### A2A Server Not Starting
```bash
# Check A2A server logs
docker logs a2a-a2a-server-1

# Rebuild A2A server only
./scripts/rebuild-a2a-only.sh
```

#### Engine State Issues
```bash
# Clear engine state
TOKEN=$(node scripts/get-technical-token.js | grep NPL_TECHNICAL_USER_TOKEN | cut -d'=' -f2)
curl -X DELETE http://localhost:12400/management/application/contents \
  -H "Authorization: Bearer $TOKEN"
```

#### Method Generation Issues
```bash
# Check deployed packages
docker exec a2a-a2a-server-1 cat /tmp/deployed-packages.json

# Check generated methods
docker exec a2a-a2a-server-1 cat /app/src/method-mappings.js
```

## Development Workflow

### Recommended Development Workflow:
1. **Start with full rebuild**: `./scripts/rebuild.sh` (first time)
2. **Use A2A-only rebuilds**: `./scripts/rebuild-a2a-only.sh` (iterative development)
3. **Clear engine when needed**: Use engine clearing for clean testing
4. **Run tests**: `cd tests && node run-tests.js`

### Quick Development Cycle:
```bash
# Make changes to A2A server code
# ...

# Quick rebuild (recommended)
./scripts/rebuild-a2a-only.sh

# Test changes
cd tests && node run-tests.js

# All tests should pass ✅
# 📊 Test Suite Summary
# ✅ Passed: 6/6 tests
# ❌ Failed: 0/6 tests
```

### Recent Improvements:
- **Fixed process detection** - Scripts now properly detect TypeScript processes
- **Optimized timing** - Added delays for container stabilization
- **Better error handling** - Clearer error messages and troubleshooting
- **Fast rebuilds** - A2A-only rebuilds complete in ~30 seconds

This workflow provides fast iteration while maintaining system stability. 