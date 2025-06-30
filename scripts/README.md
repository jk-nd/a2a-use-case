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

## Script Features

Both scripts include:
- ✅ **Error handling**: Scripts exit on any error
- ✅ **Progress indicators**: Clear step-by-step progress
- ✅ **Verification**: Multiple health checks and validations
- ✅ **User provisioning**: Automatic user and token setup
- ✅ **Service status**: Final status report with URLs
- ✅ **TypeScript verification**: Ensures latest code is running

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm available
- Internet connection for pulling base images
- Sufficient disk space for Docker images

## Troubleshooting

If scripts fail:
1. Check Docker is running
2. Ensure sufficient disk space
3. Try `rebuild.sh` for a complete clean rebuild
4. Check container logs: `docker-compose logs <service-name>` 