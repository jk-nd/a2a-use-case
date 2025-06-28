# Agent2Agent (A2A) with NPL Integration

This project demonstrates the integration of Google's Agent2Agent (A2A) protocol with the NOUMENA Protocol Language (NPL) for policy enforcement in multi-agent workflows.

## 🎯 **Current Status: Phase 1 Complete**

✅ **Minimal wiring implemented and tested**
- A2A Server (policy hub) working
- Procurement Agent implemented and tested
- Agent-to-Agent communication proven
- Policy enforcement via A2A hub working
- **NPL Engine fully configured and accessible**
- **All APIs (Core, Management, Admin, Streaming) working with authentication**

## Architecture

The system consists of five main components:

1. **A2A Server** (Node.js/TypeScript) - Policy enforcement hub and agent communication
2. **Procurement Agent** (Node.js/TypeScript) - Handles RFP creation and submission
3. **NPL Engine** - Policy engine for enforcing business rules and state transitions
4. **Keycloak** - Identity and Access Management (IAM) for authentication and authorization
5. **PostgreSQL** - Database for NPL engine state persistence

## Features

- **A2A Protocol Compliance**: Full implementation of Google's Agent2Agent protocol using official TypeScript types
- **NPL Policy Enforcement**: Integration with NOUMENA Protocol Language for business rule enforcement
- **Multi-Agent Workflows**: Support for complex agent interactions with stateful workflows
- **Fine-Grained Authorization**: Role-based access control through Keycloak integration
- **Auditable Operations**: Complete audit trail of agent interactions and policy decisions
- **Agentic Behavior**: Structured, rule-based agents without LLM dependencies
- **Full API Access**: All NPL engine APIs (Core, Management, Admin, Streaming) accessible with proper authentication

## Use Case: Multi-Agent RFP Workflow

The system implements a Request for Proposal (RFP) workflow involving multiple agents:

- **Procurement Agent** ✅ **IMPLEMENTED**: Creates RFPs, submits for approval, tracks status
- **Finance Agent**: Validates budgets and approves financial aspects (planned)
- **Legal Agent**: Reviews contracts and ensures compliance (planned)
- **Vendor Onboarding Agent**: Manages vendor registration and verification (planned)

Each agent interaction is governed by NPL policies that enforce:
- State transitions (draft → submitted → approved → executed)
- Authorization rules (who can perform what actions)
- Business constraints (budget limits, approval thresholds)
- Audit requirements (logging all decisions)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- NPL CLI (for deploying NPL protocols)

### 1. Start the Infrastructure

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Verify Services

```bash
# Test A2A server health
curl http://localhost:8000/health

# Test Procurement Agent health
curl http://localhost:8001/health

# Test NPL engine health
curl http://localhost:12000/actuator/health

# Test Keycloak (admin console at http://localhost:11000)
```

### 3. Test NPL Engine APIs

```bash
# Get authentication token
export TOKEN=$(curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123" \
  | jq -r '.access_token')

# Test streaming API
curl -H "Authorization: Bearer $TOKEN" http://localhost:12000/api/streams

# Test management API
curl -H "Authorization: Bearer $TOKEN" http://localhost:12400/management/analysis

# Test admin API
curl -H "Authorization: Bearer $TOKEN" http://localhost:12700/admin/health
```

### 4. Test Agent Integration

```bash
# Test the complete workflow
node test_procurement_agent.js

# Test A2A server directly
node test_a2a_client.js
```

## NPL Engine Configuration

### Key Configuration Learnings

The NPL engine requires specific configuration for proper API access and authentication:

#### 1. **Management and Admin API Access**

By default, the management and admin APIs only bind to `127.0.0.1` (localhost inside the container). To make them accessible from outside the container, add these environment variables:

```yaml
environment:
  ENGINE_ADMIN_HOST: 0.0.0.0
  ENGINE_MANAGEMENT_HOST: 0.0.0.0
```

#### 2. **Keycloak Issuer Configuration**

For consistent authentication, configure Keycloak to issue tokens with the correct issuer URL:

```yaml
environment:
  KC_HOSTNAME: keycloak
  KC_HOSTNAME_URL: http://keycloak:11000
  KC_HOSTNAME_ADMIN_URL: http://keycloak:11000
```

#### 3. **Engine Trusted Issuers**

Configure the engine to trust tokens from Keycloak:

```yaml
environment:
  ENGINE_ALLOWED_ISSUERS: "http://keycloak:11000/realms/noumena"
```

### Available APIs

| API | Port | Purpose | Access |
|-----|------|---------|--------|
| **Core API** | 12000 | Protocol operations, streaming | External |
| **Management API** | 12400 | Code analysis, admin tasks | External (with config) |
| **Admin API** | 12700 | System administration | External (with config) |
| **Swagger UI** | 12000 | API documentation | http://localhost:12000/swagger-ui/ |

### Authentication

All APIs require JWT tokens from Keycloak:

```bash
# Get token
curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123"

# Use token
curl -H "Authorization: Bearer <token>" http://localhost:12000/api/streams
```

## Service Endpoints

### A2A Server (Port 8000) - Policy Hub
- `GET /health` - Health check
- `GET /a2a/agent-card` - Agent capabilities and skills
- `POST /a2a/request` - Handle A2A protocol requests

### Procurement Agent (Port 8001) - RFP Management
- `GET /health` - Health check
- `GET /a2a/agent-card` - Agent capabilities and skills
- `POST /a2a/request` - Handle RFP operations:
  - `create_rfp` - Create new RFP
  - `submit_rfp` - Submit RFP for approval
  - `track_rfp` - Track RFP status

### NPL Engine APIs

#### Core API (Port 12000)
- `GET /actuator/health` - Health check
- `GET /api/streams` - Real-time protocol updates (SSE)
- `POST /api/protocols/{protocol}/instances` - Create protocol instances
- Swagger UI: http://localhost:12000/swagger-ui/

#### Management API (Port 12400)
- `GET /management/analysis` - Code analysis and deprecation reports
- `GET /management/health` - Management API health check

#### Admin API (Port 12700)
- `GET /admin/health` - Admin API health check
- System administration endpoints

### Keycloak (Port 11000)
- Admin Console: http://localhost:11000
- Realm: `noumena`
- Default User: `alice` / `password123`
- Token Endpoint: `http://localhost:11000/realms/noumena/protocol/openid-connect/token`

## 🧪 **Testing Results**

### NPL Engine Test Results
```bash
✅ Health check passed
✅ Authentication working (JWT tokens accepted)
✅ Streaming API accessible
✅ Management API accessible (with proper configuration)
✅ Admin API accessible (with proper configuration)
✅ All APIs binding to correct interfaces
```

### Procurement Agent Test Results
```bash
✅ Health check passed
✅ Agent card retrieved (Create RFP, Submit RFP, Track RFP)
✅ RFP created successfully
✅ RFP tracked successfully  
✅ RFP submitted successfully (with policy enforcement)
```

### Agent Communication Flow
```
Procurement Agent → A2A Hub → NPL Engine
     (8001)         (8000)      (12000)
```

## Development

### Procurement Agent (TypeScript/Node.js)

```bash
cd procurement-agent

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### A2A Server (TypeScript/Node.js)

```bash
cd a2a-server

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Adding New Agents

To add a new agent (e.g., Finance Agent):

1. **Create agent directory structure:**
```bash
mkdir finance-agent
cd finance-agent
# Copy structure from procurement-agent
```

2. **Update docker-compose.yml:**
```yaml
finance-agent:
  build: ./finance-agent
  environment:
    PORT: 8002
    A2A_HUB_URL: http://a2a-server:8000
  ports:
    - "8002:8002"
  depends_on:
    - a2a-server
```

3. **Implement agent skills:**
```typescript
const agentSkills: AgentSkill[] = [
  {
    id: 'approve_budget',
    name: 'Approve Budget',
    description: 'Approve budget for RFP',
    examples: ['Approve budget for software development'],
    tags: ['budget', 'approval']
  }
];
```

### NPL Protocol Development

Create NPL protocols in `src/main/npl-1.0.0/`:

```npl
package rfp_workflow

@api
protocol[procurement, finance, legal] RfpWorkflow(var amount: Number) {
    // Protocol implementation
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NPL_ENGINE_URL` | NPL Engine endpoint | `http://engine:12000` |
| `KEYCLOAK_URL` | Keycloak endpoint | `http://keycloak:11000` |
| `KEYCLOAK_REALM` | Keycloak realm | `noumena` |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | `noumena` |
| `A2A_HUB_URL` | A2A Hub endpoint | `http://a2a-server:8000` |

### NPL Engine Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENGINE_ADMIN_HOST` | Admin API binding address | `127.0.0.1` | For external access |
| `ENGINE_MANAGEMENT_HOST` | Management API binding address | `127.0.0.1` | For external access |
| `ENGINE_ALLOWED_ISSUERS` | Trusted JWT issuers | - | Required |
| `ENGINE_DB_SCHEMA` | Database schema | `engine-schema` | Required |

### Keycloak Setup

The system includes a pre-configured Keycloak realm with:
- Realm: `noumena`
- Client: `noumena` (public client)
- User: `alice` with password `password123`
- Roles: `procurement`, `finance`, `legal`, `vendor`

## Testing

### Manual Testing

```bash
# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:12000/actuator/health

# Test agent cards
curl http://localhost:8000/a2a/agent-card
curl http://localhost:8001/a2a/agent-card

# Test NPL engine APIs (with authentication)
export TOKEN=$(curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123" \
  | jq -r '.access_token')

curl -H "Authorization: Bearer $TOKEN" http://localhost:12000/api/streams
curl -H "Authorization: Bearer $TOKEN" http://localhost:12400/management/analysis

# Test procurement agent
curl -X POST http://localhost:8001/a2a/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-1",
    "method": "create_rfp",
    "params": {
      "agent_id": "procurement_user",
      "title": "Software Development",
      "amount": 50000
    }
  }'
```

### Automated Testing

```bash
# Test procurement agent workflow
node test_procurement_agent.js

# Test A2A server
node test_a2a_client.js
```

## Architecture Benefits

1. **Protocol Compliance**: Uses official A2A TypeScript types for full protocol compliance
2. **Type Safety**: TypeScript provides compile-time type checking and better developer experience
3. **Scalability**: Node.js/Express provides excellent performance for API endpoints
4. **Integration**: Seamless integration between A2A protocol and NPL policy engine
5. **Security**: Keycloak provides enterprise-grade authentication and authorization
6. **Auditability**: Complete audit trail of all agent interactions and policy decisions
7. **Agentic Behavior**: Structured, rule-based agents with predictable behavior
8. **Full API Access**: All NPL engine APIs accessible with proper configuration and authentication

## 🚀 **Next Steps**

### Phase 2: Add LLM Capabilities
- **RFP Content Generation**: Use LLM to fill detailed RFP descriptions
- **Natural Language Interface**: Allow conversational agent interactions
- **Intelligent Routing**: Route requests based on content analysis

### Phase 3: Complete Multi-Agent Workflow
1. **Finance Agent**: Implement budget approval workflows
2. **Legal Agent**: Implement contract review processes
3. **Vendor Onboarding Agent**: Implement vendor registration
4. **NPL Protocols**: Deploy comprehensive business rules

### Phase 4: Production Readiness
1. **Enhanced Security**: Implement proper JWT verification
2. **Monitoring**: Add comprehensive logging and monitoring
3. **Performance**: Optimize for high-throughput agent interactions
4. **Testing**: Add comprehensive unit and integration tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
