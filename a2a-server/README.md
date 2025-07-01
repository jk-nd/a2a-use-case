# A2A Server (Hybrid)

A hybrid Agent-to-Agent (A2A) server that combines Google A2A SDK with Noumena Protocol Language (NPL) integration.

## Architecture

This server provides a unified A2A interface that routes method calls to either:
- **Google A2A SDK**: For standard agent operations (health, status, capabilities, etc.)
- **NPL Engine**: For protocol-specific operations (RFP workflows, payments, etc.)

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

### 🔄 Hybrid Routing
- **Automatic Method Routing**: Routes calls to appropriate handler based on protocol/method
- **Google A2A Integration**: Standard agent operations via Google's A2A SDK
- **NPL Integration**: Protocol-specific operations via NPL engine

### 🔐 Multi-IdP Authentication
- **Keycloak Support**: Main A2A and engine authentication
- **Multi-Organization**: Separate Keycloaks for procurement and finance agents
- **Dynamic Token Validation**: Validates tokens from multiple IdPs based on issuer claims

### 🎯 Agent Skills
- **Dynamic Skills Generation**: Automatically generates agent skills from NPL protocols
- **Google Standard Skills**: Health, status, capabilities, discovery, connection management
- **Protocol-Specific Skills**: RFP operations, payment processing, etc.

### 🔧 Code Generation
- **OpenAPI Integration**: Generates method handlers from NPL engine OpenAPI specs
- **Automatic Updates**: Regenerate code when NPL protocols change
- **Type Safety**: Generated code includes proper error handling and validation

### 🚀 Recent Improvements
- **Self-contained Method Handlers**: Fixed variable capture issues in generated handlers
- **Protocol Name Extraction**: Improved extraction from OpenAPI paths
- **Error Handling**: Enhanced handling of empty/malformed responses
- **Auto-refresh**: Real-time protocol discovery and method generation

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
  "package": "rfp_workflow",
  "protocol": "RfpWorkflow",
  "method": "submitForApproval",
  "params": {
    "protocolId": "rfp-123",
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
  "protocols": ["rfp_workflow", "payment_protocol", "google.agent"],
  "skills": [
    {
      "protocol": "rfp_workflow",
      "methods": [
        { "name": "submitForApproval", "description": "Submit RFP for approval" },
        { "name": "approveBudget", "description": "Approve RFP budget" }
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
    "npl": ["rfp_workflow", "payment_protocol"],
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

## Code Generation

### Generated Files
- `src/method-handlers.js` - NPL method handlers
- `src/method-mappings.js` - Method routing mappings
- `src/agent-skills.js` - Agent skills definitions
- `src/server.js` - Main server with hybrid routing

### Regeneration
When NPL protocols change:
```bash
npm run generate
```

### Auto-refresh
The server automatically refreshes method handlers every 30-60 seconds to pick up new protocols.

## Development

### Adding New Protocols
1. Deploy new protocol to NPL engine
2. Run `npm run generate` to update method handlers
3. Restart server to load new methods (or wait for auto-refresh)

### Custom Google A2A Methods
Add custom methods to the Google A2A SDK integration:

```typescript
// In src/server.ts
const googleA2AMethods = {
  'google.agent.health': async (params) => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  },
  'google.agent.custom': async (params) => {
    // Custom method implementation
  }
};
```

### Debugging

Enable debug logging:
```bash
DEBUG=a2a:* npm run dev
```

Check method handler generation:
```bash
node generate-a2a-methods.js --debug
```

## Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test skills discovery
curl http://localhost:8000/a2a/skills

# Test method execution (requires valid token)
curl -X POST http://localhost:8000/a2a/method \
  -H "Content-Type: application/json" \
  -d '{
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "submitForApproval",
    "params": {"protocolId": "test-123"},
    "token": "your_jwt_token"
  }'
```

### Automated Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Method not found**
   - Check if protocol is deployed to NPL engine
   - Run `npm run generate` to refresh handlers
   - Check method name matches NPL permission name

2. **Authentication errors**
   - Verify JWT token is valid
   - Check token issuer is in trusted list
   - Ensure user has required roles

3. **NPL engine connection**
   - Verify NPL engine is running on port 12000
   - Check NPL_ENGINE_URL environment variable
   - Test direct connection: `curl http://localhost:12000/actuator/health`

4. **Generated handler errors**
   - Check TypeScript compilation: `npm run build`
   - Regenerate handlers: `npm run generate`
   - Restart server to load new handlers

### Logs
```bash
# View server logs
docker-compose logs a2a-server

# View with follow
docker-compose logs -f a2a-server

# View specific service
docker-compose logs npl-engine
```

## Performance

### Current Metrics
- **Method Execution**: < 100ms average
- **Protocol Discovery**: < 5 seconds
- **Method Generation**: < 2 seconds
- **Concurrent Requests**: 100+ supported

### Optimization
- Method handlers cached in memory
- Auto-refresh runs in background
- Connection pooling for NPL engine
- Async processing for non-blocking operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 