# Agent2Agent (A2A) with NPL Integration

This project demonstrates the integration of Google's Agent2Agent (A2A) protocol with the NOUMENA Protocol Language (NPL) for policy enforcement in multi-agent workflows.

## 🎯 **Current Status: A2A Integration Complete! ✅**

✅ **Full A2A workflow implemented and tested**
- A2A Server (policy hub) working with automated code generation
- Procurement Agent implemented and tested
- Finance Agent implemented and tested
- Agent-to-Agent communication via A2A protocol proven
- Policy enforcement via NPL engine working
- **Complete RFP workflow tested end-to-end**
- **All A2A method calls successful**
- **All state transitions working**
- **Message passing between agents and A2A server working**

## 🧪 **Latest Test Results: A2A RFP Flow Integration**

### ✅ **Successful End-to-End Test**

The complete A2A RFP workflow has been successfully tested and is working:

```bash
🎉 A2A RFP Flow Integration Test completed successfully!
📈 Workflow Summary:
   draft → pendingApproval → approved → active
   ✅ All A2A method calls completed successfully!
   ✅ All state transitions completed successfully!
   ✅ Message passing between agents and A2A server working!

📊 Final RFP Details:
   RFP ID: rfp-a2a-1751160577228
   Protocol ID: f423ba18-780d-4339-ad07-4d4fe74769b8
   Final State: active
   Requested Amount: $75000
   Approved Amount: $75000
```

### ✅ **Tested A2A Methods**

All A2A methods are working correctly:

1. **`submitforapproval`** - Procurement agent submits RFP for approval
2. **`approvebudget`** - Finance agent approves budget with parameters
3. **`activaterfp`** - Procurement agent activates approved RFP
4. **`getrfpdetails`** - Query RFP details
5. **`getcurrentbudget`** - Query current budget amount
6. **`getbudgetapproval`** - Query budget approval status

### ✅ **Integration Architecture Working**

- **Code Generation**: A2A methods automatically generated from NPL OpenAPI
- **Parameter Passing**: Method parameters correctly passed to NPL engine
- **State Management**: All protocol state transitions working
- **Authentication**: Multi-IdP token validation working
- **Response Handling**: Empty responses and JSON responses handled correctly

## Architecture

The system consists of five main components:

1. **A2A Server** (Node.js/TypeScript) - Policy enforcement hub and agent communication with **automated code generation from NPL OpenAPI**
2. **Procurement Agent** (Node.js/TypeScript) - Handles RFP creation and submission
3. **NPL Engine** - Policy engine for enforcing business rules and state transitions
4. **Keycloak** - Identity and Access Management (IAM) for authentication and authorization
5. **PostgreSQL** - Database for NPL engine state persistence

## A2A Server Architecture: Code Generation from NPL OpenAPI

The A2A Server implements a **code generation architecture** that automatically creates A2A protocol methods from NPL OpenAPI specifications:

### Code Generation Strategy

The A2A Server uses a **code generation approach** to automatically create method handlers from NPL OpenAPI specifications:

1. **OpenAPI Discovery**: Fetches NPL protocol OpenAPI specs from the engine
2. **Method Generation**: Automatically generates TypeScript method handlers for each NPL protocol permission
3. **A2A Protocol Compliance**: Exposes NPL protocols as standard A2A methods
4. **Type Safety**: Maintains full TypeScript type safety throughout the integration

### Generated Components

The code generator creates three key components:

#### 1. Method Handlers (`src/method-handlers.js`)
```typescript
// Auto-generated from NPL OpenAPI
export const nplMethodHandlers = {
  'rfp_workflow.RfpWorkflow.createRfp': async (params, auth) => {
    // Handles RFP creation via NPL engine
  },
  'rfp_workflow.RfpWorkflow.submitForApproval': async (params, auth) => {
    // Handles RFP submission via NPL engine
  }
  // ... more handlers generated for each protocol permission
};
```

#### 2. Method Mappings (`src/method-mappings.js`)
```typescript
// Maps A2A method names to NPL handlers
export const methodMappings = {
  'create_rfp': 'rfp_workflow.RfpWorkflow.createRfp',
  'submit_rfp': 'rfp_workflow.RfpWorkflow.submitForApproval',
  // ... mappings for all available methods
};
```

#### 3. Agent Skills (`src/agent-skills.js`)
```typescript
// Auto-generated agent capabilities from NPL protocols
export const agentSkills = [
  {
    id: 'create_rfp',
    name: 'Create RFP',
    description: 'Create a new Request for Proposal',
    examples: ['Create RFP for software development'],
    tags: ['rfp', 'procurement']
  }
  // ... skills generated for each protocol method
];
```

### Request Flow

```
A2A Request → A2A Server → Method Router → Generated Handler → NPL Engine
     ↓              ↓           ↓              ↓              ↓
  JSON-RPC    Authentication  Mapping    Protocol      Policy
  Protocol    & Validation    Logic      Instance      Enforcement
```

### Multi-IdP Support

The architecture supports **multiple Identity Providers** for cross-organization agent collaboration:

- **A2A Server & NPL Engine**: Use shared Keycloak as trusted broker
- **Agent Organizations**: Can use separate Keycloaks with different IdPs
- **Dynamic Validation**: A2A service validates tokens from multiple IdPs based on JWT issuer claims
- **Party Binding**: NPL protocols dynamically bind parties to actual users at runtime

### Code Generation Process

```bash
# Generate handlers from NPL OpenAPI
node generate-a2a-methods.js

# This script:
# 1. Fetches OpenAPI specs from NPL engine
# 2. Parses NPL-specific protocol structure
# 3. Generates TypeScript handlers for each permission
# 4. Creates method mappings and agent skills
# 5. Updates server configuration
```

### Benefits of This Architecture

1. **Zero Manual Integration**: No need to manually write NPL integration code
2. **Protocol Compliance**: Full Google A2A protocol compliance with generated handlers
3. **Type Safety**: Complete TypeScript type safety across the entire stack
4. **Dynamic Updates**: New NPL protocols automatically generate new A2A methods
5. **Multi-IdP Ready**: Supports agents from different organizations with different IdPs
6. **Maintainable**: Clear separation between generated and custom code
7. **Scalable**: Easy to add new protocols without code changes
8. **NPL-First**: All business logic and policy enforcement happens in NPL

### File Structure

```
a2a-server/
├── src/
│   ├── server.js              # Main A2A server with generated routing
│   ├── method-handlers.js     # Generated NPL method handlers
│   ├── method-mappings.js     # Generated method name mappings
│   ├── agent-skills.js        # Generated agent capabilities
│   └── types.ts              # TypeScript type definitions
├── generate-a2a-methods.js    # Code generation script
├── package.json              # Dependencies and scripts
└── README.md                 # A2A server documentation
```

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

### 3. User Provisioning

The A2A workflow requires both human users and agent users to be provisioned in Keycloak. Use the provided scripts for systematic user management:

```bash
# Install dependencies
npm install axios

# Provision all users (humans and agents)
node provision-users.js

# Test user authentication
node test-user-provisioning.js
```

#### User Configuration

The user provisioning system is configured via `user-config.json`:

```json
{
  "realm": "a2a-realm",
  "users": {
    "humans": [
      {
        "username": "buyer",
        "email": "buyer@company.com",
        "attributes": {
          "role": ["buyer"],
          "organization": ["company-a"],
          "permissions": ["create_rfp", "review_proposals"]
        }
      }
    ],
    "agents": [
      {
        "username": "procurement_agent",
        "email": "procurement-agent@company.com",
        "attributes": {
          "role": ["agent"],
          "agent_type": ["procurement"],
          "capabilities": ["rfp_creation", "proposal_evaluation"],
          "api_endpoint": ["http://localhost:3001/api"]
        }
      }
    ]
  }
}
```

#### Provisioned Users

| Type | Username | Role | Organization | Purpose |
|------|----------|------|--------------|---------|
| Human | `buyer` | Buyer | Company A | Create RFPs, review proposals |
| Human | `supplier` | Supplier | Vendor B | Submit proposals, track deliveries |
| Human | `finance_manager` | Finance Manager | Company A | Approve budgets, process payments |
| Agent | `procurement_agent` | Procurement Agent | Company A | Automated RFP management |
| Agent | `finance_agent` | Finance Agent | Company A | Automated financial operations |
| Agent | `supplier_agent` | Supplier Agent | Vendor B | Automated proposal generation |

#### Testing User Authentication

```bash
# Test individual user authentication
curl -X POST http://localhost:8080/realms/a2a-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=npl-engine&username=buyer&password=password123"

# Test agent authentication
curl -X POST http://localhost:8080/realms/a2a-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=npl-engine&username=procurement_agent&password=agent-password-123"
```

### 4. Test NPL Engine APIs

```bash
# Get authentication token
curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123"

# Use token
curl -H "Authorization: Bearer <token>" http://localhost:12000/api/streams
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

## NPL Protocol Deployment

### Deployment Methods

There are two ways to deploy NPL protocols to the engine:

#### 1. **NPL CLI (Development Mode Only)**

The NPL CLI is only available when running the engine in development mode with embedded OIDC:

```bash
# Only works with ENGINE_DEV_MODE=true
npl deploy --sourceDir src/main
```

**⚠️ Important**: This method does NOT work when using Keycloak authentication.

#### 2. **Management API (Production/Keycloak Mode)**

When using Keycloak authentication, deploy protocols via the Management API:

```bash
# 1. Create a ZIP archive of your NPL sources
cd src/main
zip -r ../../protocol.zip .
cd ../..

# 2. Get authentication token
curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123"

# 3. Deploy via Management API
curl -X PUT http://localhost:12400/management/application \
  -H "Authorization: Bearer <token>" \
  -F "archive=@protocol.zip" \
  -F "tag=my-protocol-1.0.0" \
  -F "uploadOrigin=MyProject@$(hostname)"
```

### Deployment Endpoints

The Management API provides two deployment endpoints:

- **`PUT /management/application`** - Deploy NPL sources and migrations
- **`PUT /management/application/sources`** - Deploy NPL sources only (for rapid prototyping)

### Verification

After deployment, verify the protocol is available:

```bash
# Check deployment metadata
curl -H "Authorization: Bearer <token>" \
  http://localhost:12400/management/application/deployment-metadata/latest

# Check if protocol appears in Swagger UI
curl -s http://localhost:12000/swagger-ui/index.html | grep -i "your-protocol-name"

# Test protocol endpoints
curl -H "Authorization: Bearer <token>" \
  http://localhost:12000/npl/your_package/-/openapi.json
```

### Example: RFP Protocol Deployment

```bash
# Create ZIP archive
cd src/main && zip -r ../../rfp-protocol.zip . && cd ../..

# Deploy RFP protocol
curl -X PUT http://localhost:12400/management/application \
  -H "Authorization: Bearer <token>" \
  -F "archive=@rfp-protocol.zip" \
  -F "tag=rfp-workflow-1.0.0" \
  -F "uploadOrigin=A2A-Project@$(hostname)"

# Verify deployment
curl -H "Authorization: Bearer <token>" \
  http://localhost:12000/npl/rfp_workflow/-/openapi.json | jq '.paths | keys'
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

### RFP Protocol Deployment Results
```bash
✅ Protocol deployed successfully via Management API
✅ API endpoints automatically generated
✅ Swagger UI updated with RFP protocol
✅ All protocol permissions exposed as REST endpoints
✅ Protocol accessible at /npl/rfp_workflow/
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

# Generate NPL method handlers from OpenAPI
node generate-a2a-methods.js

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

#### Code Generation Workflow

The A2A Server uses automated code generation to create NPL integration handlers:

```bash
# 1. Generate handlers from NPL OpenAPI specs
node generate-a2a-methods.js

# 2. Verify generated files
ls -la src/
# Should show: method-handlers.js, method-mappings.js, agent-skills.js

# 3. Start server with generated handlers
npm start
```

#### Generated Files

After running the generator, these files are created/updated:

- **`src/method-handlers.js`** - TypeScript handlers for each NPL protocol permission
- **`src/method-mappings.js`** - Mapping between A2A method names and NPL handlers  
- **`src/agent-skills.js`** - Agent capabilities derived from NPL protocols

#### Adding New NPL Protocols

When you deploy new NPL protocols to the engine:

1. **Deploy protocol to NPL engine** (see NPL Protocol Deployment section)
2. **Regenerate A2A handlers**:
   ```bash
   cd a2a-server
   node generate-a2a-methods.js
   ```
3. **Restart A2A server**:
   ```bash
   npm restart
   ```

The new protocol methods will automatically be available as A2A skills without any manual code changes.

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

# Test A2A server agent card (shows generated skills)
curl http://localhost:8000/a2a/agent-card

# Test procurement agent
curl http://localhost:8001/a2a/agent-card

# Test NPL engine APIs (with authentication)
export TOKEN=$(curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123" \
  | jq -r '.access_token')

curl -H "Authorization: Bearer $TOKEN" http://localhost:12000/api/streams
curl -H "Authorization: Bearer $TOKEN" http://localhost:12400/management/analysis

# Test deployed RFP protocol
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:12000/npl/rfp_workflow/RfpWorkflow/

# Create a new RFP instance
curl -X POST http://localhost:12000/npl/rfp_workflow/RfpWorkflow/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "procurement": "alice@example.com",
    "finance": "bob@example.com", 
    "legal": "charlie@example.com",
    "initialBudget": 50000,
    "description": "Software Development Services"
  }'

# Test A2A server with generated NPL methods
curl -X POST http://localhost:8000/a2a/request \
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

### Code Generation Testing

```bash
# Test code generation
cd a2a-server
node generate-a2a-methods.js

# Verify generated files
ls -la src/method-handlers.js src/method-mappings.js src/agent-skills.js

# Test generated skills endpoint
curl http://localhost:8000/a2a/agent-card | jq '.skills'
```

### Automated Testing

```bash
# Test procurement agent workflow
node test_procurement_agent.js

# Test A2A server
node test_a2a_client.js

# Test agent connection
node test_agent_connection.js

# Test finance agent
node test_finance_agent.js

# Test RFP integration
node test_rfp_integration.js

# 🆕 Test complete A2A RFP workflow
node test_a2a_rfp_flow.js
```

## 🆕 **A2A Integration Testing**

### Running the Complete A2A RFP Flow Test

The most comprehensive test demonstrates the full A2A integration:

```bash
# Run the complete A2A RFP workflow test
node test_a2a_rfp_flow.js
```

### What the A2A Test Does

This test demonstrates the complete integration between Google's A2A protocol and the NPL engine:

1. **Authentication**: Gets JWT tokens for procurement and finance agents from Keycloak
2. **Protocol Creation**: Creates a new RFP protocol instance via NPL engine
3. **A2A Method Calls**: Uses A2A protocol to call NPL methods:
   - `submitforapproval` - Procurement agent submits RFP for approval
   - `approvebudget` - Finance agent approves budget with parameters
   - `activaterfp` - Procurement agent activates approved RFP
4. **State Verification**: Verifies each state transition via NPL engine
5. **Query Methods**: Tests additional A2A methods for data retrieval

### Expected Output

```
🧪 Starting A2A RFP Flow Integration Test...

🔑 Getting access tokens for agents...
✅ Tokens obtained successfully

📝 Step 1: Creating new RFP workflow instance...
✅ RFP workflow created with protocol ID: f423ba18-780d-4339-ad07-4d4fe74769b8
📋 Initial state: draft

📤 Step 2: Procurement Agent submits RFP for approval via A2A...
🤖 Procurement Agent sending A2A request: submitforapproval
📥 A2A Response to Procurement Agent: { "success": true, ... }
✅ Procurement Agent received response for submitforapproval
📋 State after submission: pendingApproval

💰 Step 3: Finance Agent approves budget via A2A...
🤖 Finance Agent sending A2A request: approvebudget
📥 A2A Response to Finance Agent: { "success": true, ... }
✅ Finance Agent received response for approvebudget
📋 State after budget approval: approved

🚦 Step 4: Procurement Agent activates RFP via A2A...
🤖 Procurement Agent sending A2A request: activaterfp
📥 A2A Response to Procurement Agent: { "success": true, ... }
✅ Procurement Agent received response for activaterfp
📋 Final state: active

🎉 A2A RFP Flow Integration Test completed successfully!
📈 Workflow Summary:
   draft → pendingApproval → approved → active
   ✅ All A2A method calls completed successfully!
   ✅ All state transitions completed successfully!
   ✅ Message passing between agents and A2A server working!
```

### Key Integration Features Demonstrated

- **JSON-RPC 2.0 Protocol**: Full A2A protocol compliance
- **Method Generation**: A2A methods automatically generated from NPL OpenAPI
- **Parameter Passing**: Method parameters correctly passed to NPL engine
- **State Management**: All protocol state transitions working
- **Multi-Agent Workflow**: Procurement and Finance agents collaborating
- **Policy Enforcement**: NPL policies enforced through A2A calls
- **Response Handling**: Both empty and JSON responses handled correctly

## Architecture Benefits

1. **Zero Manual Integration**: Automated code generation eliminates manual NPL integration work
2. **Protocol Compliance**: Uses official A2A TypeScript types for full protocol compliance
3. **Type Safety**: Complete TypeScript type safety across the entire stack
4. **NPL-First Architecture**: All business logic and policy enforcement happens in NPL
5. **Dynamic Updates**: New NPL protocols automatically generate new A2A methods
6. **Multi-IdP Ready**: Supports agents from different organizations with different IdPs
7. **Scalability**: Node.js/Express provides excellent performance for API endpoints
8. **Security**: Keycloak provides enterprise-grade authentication and authorization
9. **Auditability**: Complete audit trail of all agent interactions and policy decisions
10. **Agentic Behavior**: Structured, rule-based agents with predictable behavior
11. **Full API Access**: All NPL engine APIs accessible with proper configuration and authentication
12. **Maintainable**: Clear separation between generated and custom code

## 🚀 **Next Steps**

### ✅ **Phase 1 Complete: A2A Integration**
- **A2A Protocol Implementation**: ✅ Complete with Google's A2A protocol
- **NPL Engine Integration**: ✅ Complete with automated code generation
- **Multi-Agent Workflow**: ✅ Complete with Procurement and Finance agents
- **Policy Enforcement**: ✅ Complete with NPL protocol state management
- **End-to-End Testing**: ✅ Complete with full workflow validation

### Phase 2: Add LLM Capabilities
- **RFP Content Generation**: Use LLM to fill detailed RFP descriptions
- **Natural Language Interface**: Allow conversational agent interactions
- **Intelligent Routing**: Route requests based on content analysis
- **Smart Agent Behavior**: Add LLM-powered decision making to agents

### Phase 3: Complete Multi-Agent Workflow
1. **Legal Agent**: Implement contract review processes
2. **Vendor Onboarding Agent**: Implement vendor registration
3. **Compliance Agent**: Implement regulatory compliance checks
4. **Advanced NPL Protocols**: Deploy comprehensive business rules

### Phase 4: Production Readiness
1. **Enhanced Security**: Implement proper JWT verification with multiple IdPs
2. **Monitoring**: Add comprehensive logging and monitoring
3. **Performance**: Optimize for high-throughput agent interactions
4. **Testing**: Add comprehensive unit and integration tests
5. **Deployment**: Production deployment with Kubernetes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Running the RFP Protocol Integration Test

### Prerequisites
- The Noumena NPL engine, Keycloak, and Postgres must be running via Docker Compose (see above).
- Users must be provisioned in Keycloak as described in `user-config.json` (see user provisioning script).
- The RFP protocol must be deployed to the NPL engine (see deployment instructions above).
- Node.js dependencies must be installed (`npm install` if needed).

### How to Run the Test

Run the following command from the project root:

```sh
node test_rfp_integration.js
```

### What the Test Does
- Authenticates as the procurement and finance agents using Keycloak.
- Creates a new RFP protocol instance via the NPL API, passing the required parties and initial RFP data.
- Uses the protocol ID (`@id`) from the creation response for all subsequent API calls (not the business `rfpId`).
- Exercises the main workflow:
  1. **Create** RFP (state: `draft`)
  2. **Submit for Approval** (state: `pendingApproval`)
  3. **Approve Budget** (state: `approved`)
  4. **Activate RFP** (state: `active`)
- Verifies that each state transition is successful and prints the current state after each step.

### Example Output
```
🧪 Starting RFP Protocol Integration Tests...
🔑 Getting access tokens...
✅ Tokens obtained successfully
📝 Test 1: Creating RFP Request as procurement agent...
✅ RFP Request created: {...}
📋 RFP ID: rfp-...
📋 Protocol ID: ...
👀 Test 2: Retrieving RFP Request as procurement agent...
✅ RFP Request retrieved: {...}
📋 Status: draft
📤 Test 3: Submitting RFP for approval as procurement agent...
✅ RFP Submitted for approval: {...}
📋 Status: pendingApproval
💰 Test 4: Approving budget as finance agent...
✅ Budget Approved: {...}
📋 Status: approved
🚦 Test 5: Activating RFP as procurement agent...
✅ RFP Activated: {...}
📋 Status: active
📊 Test 6: Checking final state...
✅ Final state retrieved: {...}
📋 Final Status: active
🎉 All integration tests passed successfully!
📈 Workflow Summary:
   draft → pendingApproval → approved → active
   ✅ All state transitions completed successfully!
```

### Troubleshooting
- Ensure the correct party names are used in the test (`procurementAgent`, `financeAgent`).
- Always use the protocol ID (`@id`) from the creation response for subsequent API calls.
- If authentication fails, check user credentials in `user-config.json` and Keycloak.
- If the protocol is not found, verify that the protocol was deployed and the correct ID is used.

---

// ... existing code ...