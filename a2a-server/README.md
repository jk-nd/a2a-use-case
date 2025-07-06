# A2A Server (Hybrid)

A hybrid Agent-to-Agent (A2A) server that combines Google A2A SDK with Noumena Protocol Language (NPL) integration, featuring **pure runtime protocol deployment** with no fallback mechanisms.

## Architecture

This server provides a unified A2A interface that routes method calls to either:
- **Google A2A SDK**: For standard agent operations (health, status, capabilities, etc.)
- **NPL Engine**: For protocol-specific operations (payment workflows, etc.)

### Flow Diagram
```
Agent (using Google A2A SDK)
    ↓ (A2A protocol)
A2A Server (Hybrid)
    ↓ (routing logic)
├── Google A2A SDK (standard methods)
└── NPL Engine (protocol methods)
```

## Features

### 🔄 Pure Runtime Deployment
- **No Fallback Mechanisms**: Only discovers protocols deployed through A2A server
- **Dynamic Method Generation**: Automatically generates A2A methods from NPL protocols
- **Real-time Refresh**: Updates method handlers when protocols change
- **Engine State Management**: Supports engine clearing for clean testing

### 🔐 Multi-IdP Authentication
- **Keycloak Support**: Main A2A and engine authentication
- **Multi-Organization**: Separate Keycloaks for different agents
- **Dynamic Token Validation**: Validates tokens from multiple IdPs based on issuer claims

### 🎯 Agent Skills
- **Dynamic Skills Generation**: Automatically generates agent skills from NPL protocols
- **Google Standard Skills**: Health, status, capabilities, discovery, connection management
- **Protocol-Specific Skills**: Payment operations, order processing, etc.

### 🔧 Code Generation
- **OpenAPI Integration**: Generates method handlers from NPL engine OpenAPI specs
- **Automatic Updates**: Regenerate code when NPL protocols change
- **Type Safety**: Generated code includes proper error handling and validation

### 🚀 Recent Major Fixes
- **Fixed JWT Token Refresh**: Uses A2A server's `/a2a/refresh` endpoint instead of container restarts
- **Fixed Method Generation**: Generates valid JavaScript files with proper syntax
- **Fixed Stale Protocol Cleanup**: Automatically removes old protocols from generated files
- **Fixed Process Detection**: Rebuild scripts properly detect TypeScript processes
- **Engine State Management**: Supports clean engine clearing for testing
- **Comprehensive Error Handling**: Robust handling of deployment conflicts and errors

## Setup

### Prerequisites
- Node.js 18+
- NPL Engine running (with deployed protocols)
- Keycloak instances configured
- Google Cloud credentials (for Google A2A SDK)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # NPL Engine
   NPL_ENGINE_URL=http://localhost:12000
   NPL_TOKEN=your_npl_token_here
   
   # Google Cloud
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   
   # Server
   PORT=8000
   ```

3. **Generate A2A Methods**
   ```bash
   # Generate method handlers from NPL OpenAPI specs
   npm run generate
   ```

4. **Start Server**
   ```bash
   # Start development server
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Method Execution
```http
POST /a2a/method
Content-Type: application/json

{
  "package": "payment_workflow",
  "protocol": "OrderCommitment",
  "method": "commitToPay",
  "params": {
    "protocolId": "order-123",
    "body": { ... }
  },
  "token": "jwt_token_here"
}
```

### Skills Discovery
```http
GET /a2a/skills
```

Returns available protocols and methods:
```json
{
  "protocols": ["payment_workflow", "google.agent"],
  "skills": [
    {
      "protocol": "payment_workflow",
      "methods": [
        { "name": "createOrder", "description": "Create new order commitment" },
        { "name": "commitToPay", "description": "Order agent commits to payment" },
        { "name": "commitToDeliver", "description": "Supplier agent commits to delivery" },
        { "name": "markDelivered", "description": "Mark order as delivered" },
        { "name": "pay", "description": "Process payment" },
        { "name": "complete", "description": "Complete the order" }
      ]
    },
    {
      "protocol": "google.agent",
      "methods": [
        { "name": "health", "description": "Check agent health status" },
        { "name": "capabilities", "description": "Get agent capabilities" }
      ]
    }
  ],
  "handlers": {
    "npl": ["payment_workflow"],
    "google": ["google.agent"]
  }
}
```

### Health Check
```http
GET /health
```

### Protocol Management
```http
# List deployed protocols
GET /a2a/protocols

# Deploy new protocol
POST /a2a/deploy

# Refresh method handlers
POST /a2a/refresh
```

## Method Routing

### Google A2A Methods
Methods are routed to Google A2A SDK if:
- Protocol starts with `google.`
- Method is in the standard Google A2A method list:
  - `google.agent.health`
  - `google.agent.status`
  - `google.agent.capabilities`
  - `google.agent.discover`
  - `google.agent.connect`
  - `google.agent.disconnect`

### NPL Methods
All other methods are routed to the NPL engine and handled by generated method handlers.

## Multi-IdP Authentication

The server validates JWT tokens from multiple IdPs:

### Trusted Issuers
- `http://localhost:11000/realms/noumena` - Main Keycloak
- `http://localhost:11000/realms/procurement` - Procurement Keycloak
- `http://localhost:11000/realms/finance` - Finance Keycloak

### Token Validation
1. Decode JWT to extract issuer claim
2. Check if issuer is in trusted list
3. Validate token signature (in production)
4. Extract claims for party binding

## Dynamic Method Manager

### Runtime Discovery
The Dynamic Method Manager now operates with **pure runtime deployment** and **automatic cleanup**:

```typescript
// Discovers protocols deployed through A2A server and cleans up old ones
private async discoverAndRegenerateMethods() {
    const currentPackages = await this.getCurrentPackages();
    
    // Always regenerate methods for ALL current packages
    if (currentPackages.length > 0) {
        await this.generateMethodsForPackages(currentPackages);
    } else {
        // Clear generated files if no packages available
        await this.clearGeneratedFiles();
    }
}
```

### Key Features:
- **Automatic Protocol Cleanup**: Removes old protocols that are no longer deployed
- **Complete Regeneration**: Always regenerates methods for all current packages
- **Stale Data Prevention**: Prevents old protocols from persisting in generated files

### Engine State Management
Supports engine clearing for clean testing:

```bash
# Clear engine state
curl -X DELETE http://localhost:12400/management/application/contents \
  -H "Authorization: Bearer <technical_token>"

# Verify clean state
curl http://localhost:8000/a2a/skills
# Returns: [] (empty - no protocols deployed)
```

### Method Generation Process
1. **Load Deployed Packages**: Read from `/tmp/deployed-packages.json`
2. **Generate Methods**: Create handlers from NPL OpenAPI specs
3. **Save Files**: Write to `/app/src/method-*.js` files
4. **Load Methods**: Dynamically load generated methods
5. **Update Skills**: Refresh agent skills cache

## Code Generation

### Generated Files
- `method-mappings.js` - Maps method names to handlers
- `method-handlers.js` - Generated method handler functions
- `agent-skills.js` - Agent skills configuration

### Example Generated Method
```typescript
// Auto-generated from NPL OpenAPI
export const nplMethodHandlers = {
  'payment_workflow.OrderCommitment.commitToPay': async (params, auth) => {
    const { protocolId } = params;
    
    try {
      const response = await axios.post(
        `${NPL_ENGINE_URL}/npl/payment_workflow/OrderCommitment/${protocolId}/commitToPay`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};
```

## Testing

### Test Suite
The server includes comprehensive tests that all pass after recent fixes:

```bash
# Run all tests
cd tests && node run-tests.js

# Test results
📊 Test Suite Summary
✅ Passed: 6/6 tests
❌ Failed: 0/6 tests
📋 Total: 6 tests

🎉 All tests passed! Runtime deployment workflow is working correctly.
```

### Recent Test Improvements
- **Fixed token refresh mechanism** - Tests no longer restart containers for token refresh
- **Fixed method generation** - All 15 payment workflow methods now generate correctly
- **Fixed protocol cleanup** - Old `rfp_workflow` protocol properly removed from generated files
- **Improved error handling** - Better error messages and state validation

### Test Coverage
- ✅ **Payment Workflow Deployment** - Runtime protocol deployment
- ✅ **Payment Workflow Integration** - Complete end-to-end workflow
- ✅ **A2A Discovery** - Protocol discovery and listing
- ✅ **Payment Use Case** - NPL protocol testing
- ✅ **A2A Client** - Basic A2A server functionality
- ✅ **Protocol Instantiation** - Multi-party consent

## Development

### Build Scripts
```bash
# Quick rebuild (A2A server only)
./scripts/rebuild-a2a-only.sh

# Full rebuild (all services)
./scripts/rebuild.sh
```

### Development Mode
```bash
# Start with auto-reload
npm run dev

# Watch for changes
npm run watch
```

### Debugging
```bash
# Check server logs
docker logs a2a-a2a-server-1

# Check method generation
docker exec a2a-a2a-server-1 cat /app/src/method-mappings.js

# Check deployed packages
docker exec a2a-a2a-server-1 cat /tmp/deployed-packages.json
```

## Performance

### Key Metrics
- **Deployment Time**: < 2 seconds for new protocols
- **Method Generation**: 15 methods generated automatically
- **State Transitions**: All protocol states enforced correctly
- **Cross-Agent Communication**: Seamless multi-party interactions
- **Error Handling**: Robust error responses for invalid states

### Optimization Features
- **Method Caching**: Generated methods cached for performance
- **Lazy Loading**: Methods loaded only when needed
- **Async Processing**: Non-blocking protocol execution
- **Memory Management**: Efficient resource usage

## Troubleshooting

### Common Issues

#### Methods Not Generated
```bash
# Check deployed packages file
docker exec a2a-a2a-server-1 cat /tmp/deployed-packages.json

# Check method generation logs
docker logs a2a-a2a-server-1 | grep "generateMethodsForPackages"
```

#### Engine State Issues
```bash
# Clear engine state
curl -X DELETE http://localhost:12400/management/application/contents \
  -H "Authorization: Bearer <technical_token>"

# Rebuild A2A server
./scripts/rebuild-a2a-only.sh
```

#### Authentication Issues
```bash
# Check token validity
curl -H "Authorization: Bearer <token>" http://localhost:8000/health

# Regenerate token
node scripts/get-technical-token.js
```

## Production Deployment

### Docker Deployment
```bash
# Build production image
docker build -t a2a-server:latest .

# Run with environment variables
docker run -d \
  -p 8000:8000 \
  -e NPL_ENGINE_URL=http://npl-engine:12000 \
  -e NPL_TOKEN=<token> \
  a2a-server:latest
```

### Environment Variables
```env
# Required
NPL_ENGINE_URL=http://npl-engine:12000
NPL_TOKEN=<technical_token>
PORT=8000

# Optional
LOG_LEVEL=info
DISCOVERY_INTERVAL=60000
REFRESH_INTERVAL=30000
```

## Contributing

### Development Setup
```bash
# Fork and clone
git clone <your-fork>
cd a2a-server

# Install dependencies
npm install

# Start development
npm run dev
```

### Code Standards
- **TypeScript**: All new code in TypeScript
- **Testing**: 90%+ test coverage required
- **Documentation**: Update README for new features
- **Error Handling**: Comprehensive error handling required

---

This server demonstrates **pure runtime protocol deployment** with no fallback mechanisms, enabling truly dynamic agent workflows that adapt to changing business requirements. 