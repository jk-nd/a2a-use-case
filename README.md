# Agent2Agent (A2A) with NPL Integration

This project demonstrates the integration of Google's Agent2Agent (A2A) protocol with the NOUMENA Protocol Language (NPL) for policy enforcement in multi-agent workflows.

## Architecture

The system consists of four main components:

1. **A2A Server** (Node.js/TypeScript) - Implements the A2A protocol and handles agent communication
2. **NPL Engine** - Policy engine for enforcing business rules and state transitions
3. **Keycloak** - Identity and Access Management (IAM) for authentication and authorization
4. **PostgreSQL** - Database for NPL engine state persistence

## Features

- **A2A Protocol Compliance**: Full implementation of Google's Agent2Agent protocol using official TypeScript types
- **NPL Policy Enforcement**: Integration with NOUMENA Protocol Language for business rule enforcement
- **Multi-Agent Workflows**: Support for complex agent interactions with stateful workflows
- **Fine-Grained Authorization**: Role-based access control through Keycloak integration
- **Auditable Operations**: Complete audit trail of agent interactions and policy decisions

## Use Case: Multi-Agent RFP Workflow

The system implements a Request for Proposal (RFP) workflow involving multiple agents:

- **Procurement Agent**: Initiates RFPs and manages the overall process
- **Finance Agent**: Validates budgets and approves financial aspects
- **Legal Agent**: Reviews contracts and ensures compliance
- **Vendor Onboarding Agent**: Manages vendor registration and verification

Each agent interaction is governed by NPL policies that enforce:
- State transitions (draft → review → approved → executed)
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

# Test NPL engine health
curl http://localhost:12000/health

# Test Keycloak (admin console at http://localhost:11000)
```

### 3. Test A2A Integration

```bash
# Install test dependencies
npm install axios

# Run the test client
node test_a2a_client.js
```

## Service Endpoints

### A2A Server (Port 8000)
- `GET /health` - Health check
- `GET /a2a/agent-card` - Agent capabilities and skills
- `POST /a2a/request` - Handle A2A protocol requests

### NPL Engine (Port 12000)
- `GET /health` - Health check
- `POST /npl/evaluate` - Evaluate NPL policies
- Swagger UI: http://localhost:12000/swagger-ui.html

### Keycloak (Port 11000)
- Admin Console: http://localhost:11000
- Realm: `noumena`
- Default User: `alice` / `password123`

## Development

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

### Adding New A2A Skills

Edit `a2a-server/src/server.ts` to add new agent skills:

```typescript
const agentSkills: AgentSkill[] = [
  {
    id: 'new_skill',
    name: 'New Skill',
    description: 'Description of the new skill',
    examples: ['Example usage 1', 'Example usage 2'],
    tags: ['tag1', 'tag2']
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
| `KEYCLOAK_URL` | Keycloak endpoint | `http://keycloak:8080` |
| `KEYCLOAK_REALM` | Keycloak realm | `noumena` |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | `noumena` |

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
curl http://localhost:12000/health

# Test agent card
curl http://localhost:8000/a2a/agent-card

# Test A2A request (requires authentication)
curl -X POST http://localhost:8000/a2a/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-1",
    "method": "policy_check",
    "params": {
      "agent_id": "test-agent",
      "action": "submit_rfp"
    }
  }'
```

### Automated Testing

```bash
# Run the Node.js test client
node test_a2a_client.js
```

## Architecture Benefits

1. **Protocol Compliance**: Uses official A2A TypeScript types for full protocol compliance
2. **Type Safety**: TypeScript provides compile-time type checking and better developer experience
3. **Scalability**: Node.js/Express provides excellent performance for API endpoints
4. **Integration**: Seamless integration between A2A protocol and NPL policy engine
5. **Security**: Keycloak provides enterprise-grade authentication and authorization
6. **Auditability**: Complete audit trail of all agent interactions and policy decisions

## Next Steps

1. **Implement RFP Workflow**: Create NPL protocols for the multi-agent RFP workflow
2. **Add More Agents**: Extend the system with additional specialized agents
3. **Enhanced Security**: Implement proper JWT verification with Keycloak
4. **Monitoring**: Add comprehensive logging and monitoring
5. **Performance**: Optimize for high-throughput agent interactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
