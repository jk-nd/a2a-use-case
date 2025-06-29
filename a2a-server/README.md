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
   NPL_ENGINE_URL=https://localhost:8443
   NPL_TOKEN=your_npl_token_here
   
   # Google Cloud
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   
   # Server
   PORT=3000
   ```

3. **Generate A2A Methods**
   ```bash
   # Generate method handlers from NPL OpenAPI specs
   npm run generate
   ```

4. **Start Server**
   ```bash
   # Development mode
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
  "protocol": "rfp_protocol",
  "method": "submit_proposal",
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
  "protocols": ["rfp_protocol", "payment_protocol", "google.agent"],
  "skills": [
    {
      "protocol": "rfp_protocol",
      "methods": [
        { "name": "submit_proposal", "description": "Submit RFP proposal" },
        { "name": "approve_proposal", "description": "Approve RFP proposal" }
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
    "npl": ["rfp_protocol", "payment_protocol"],
    "google": ["google.agent"]
  }
}
```

### Health Check
```http
GET /health
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
- `http://localhost:8080/realms/a2a` - Main Keycloak
- `http://localhost:8081/realms/procurement` - Procurement Keycloak
- `http://localhost:8082/realms/finance` - Finance Keycloak

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

## Development

### Adding New Protocols
1. Deploy new protocol to NPL engine
2. Run `npm run generate` to update method handlers
3. Restart server to load new methods

### Custom Google A2A Methods
Add custom methods to the `googleMethods` array in `generate-a2a-methods.js`:
```javascript
const googleMethods = [
    'google.agent.health',
    'google.agent.status',
    'google.agent.custom_method', // Add your custom method
    // ...
];
```

### Testing
```bash
# Run tests
npm test

# Test specific endpoint
curl -X POST http://localhost:3000/a2a/method \
  -H "Content-Type: application/json" \
  -d '{"protocol":"google.agent","method":"health","token":"your_token"}'
```

## Production Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
- Set `NODE_ENV=production`
- Configure proper Google Cloud credentials
- Set up proper Keycloak URLs and certificates
- Configure logging and monitoring

## Troubleshooting

### Common Issues

1. **NPL Engine Connection**
   - Verify `NPL_ENGINE_URL` and `NPL_TOKEN`
   - Check NPL engine is running and accessible

2. **Google A2A SDK**
   - Verify Google Cloud credentials
   - Check `GOOGLE_CLOUD_PROJECT` is set
   - Ensure proper IAM permissions

3. **Token Validation**
   - Check JWT issuer is in trusted list
   - Verify token format and signature
   - Ensure proper Keycloak configuration

4. **Method Routing**
   - Check method exists in generated handlers
   - Verify protocol/method naming
   - Check NPL engine has deployed protocols

### Logs
The server logs routing decisions:
```
Routing to Google A2A SDK: google.agent.health
Routing to NPL engine: rfp_protocol.submit_proposal
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 