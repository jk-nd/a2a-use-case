# Agent2Agent (A2A) with Dynamic NPL Integration

A multi-agent system that combines Google's Agent2Agent (A2A) protocol with NOUMENA Protocol Language (NPL) for dynamic, policy-driven agent workflows.

## 🎯 **The Vision**

A system where business processes are dynamically orchestrated by intelligent agents that can:
- **Deploy new workflows on-the-fly** without system restarts
- **Enforce complex business policies** through formal protocol languages
- **Collaborate across organizational boundaries** with secure, auditable interactions
- **Adapt to changing requirements** by updating protocols in real-time

This project demonstrates a **policy-first, agent-driven architecture** where:
- **NPL protocols** define the business rules and state transitions
- **A2A agents** execute the workflows with full policy compliance
- **Dynamic deployment** allows new protocols to be added at runtime
- **Multi-IdP authentication** enables cross-organization collaboration

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Procurement   │    │   Finance       │    │   Supplier      │
│     Agent       │    │     Agent       │    │     Agent       │
│   (Port 8001)   │    │   (Port 8002)   │    │   (Port 8003)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      A2A Server           │
                    │   (Policy Hub)            │
                    │   (Port 8000)             │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │ Dynamic Method      │  │
                    │  │ Manager             │  │
                    │  │ • Auto-discovers    │  │
                    │  │   protocols         │  │
                    │  │ • Generates A2A     │  │
                    │  │   methods           │  │
                    │  │ • Real-time refresh │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     NPL Engine            │
                    │   (Policy Engine)         │
                    │   (Port 12000)            │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │ Protocol Instances  │  │
                    │  │ • State Management  │  │
                    │  │ • Policy Enforcement│  │
                    │  │ • Audit Trail       │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Keycloak              │
                    │   (Identity & Access)     │
                    │   (Port 11000)            │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │ Multi-IdP Support   │  │
                    │  │ • Cross-org auth    │  │
                    │  │ • JWT validation    │  │
                    │  │ • Role-based access │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

## 🚀 **Key Features**

### 1. **Dynamic Protocol Deployment**
Systems typically require code changes and deployments for new workflows. This architecture enables **runtime protocol deployment**:

```bash
# Deploy a new workflow without restarting anything
curl -X POST http://localhost:8000/a2a/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "package": "invoice_workflow",
    "protocol": "InvoiceProcessing", 
    "nplCode": "package invoice_workflow\n\n@api\nprotocol[buyer, seller] InvoiceProcessing(var amount: Number) {\n  // Business logic here\n}",
    "token": "<jwt_token>"
  }'

# The new protocol is immediately available as A2A methods
curl http://localhost:8000/a2a/skills
# Shows: invoice_workflow.InvoiceProcessing.createInvoice, approveInvoice, etc.
```

### 2. **Policy-First Architecture**
Business rules are defined in **NPL protocols** (not in application code):

```npl
package rfp_workflow

@api
protocol[procurement, finance] RfpWorkflow(var amount: Number) {
    initial state draft;
    state pendingApproval;
    final state approved;
    final state rejected;

    @api
    permission[procurement] submitForApproval() | draft {
        require(amount > 0, "Amount must be positive");
        become pendingApproval;
    };

    @api
    permission[finance] approveBudget() | pendingApproval {
        require(amount <= 100000, "Amount exceeds approval limit");
        become approved;
    };
}
```

### 3. **Automatic A2A Method Generation**
NPL protocols automatically become A2A methods through **code generation**:

```typescript
// Auto-generated from NPL OpenAPI
export const nplMethodHandlers = {
  'rfp_workflow.RfpWorkflow.submitForApproval': async (params, auth) => {
    // Handles RFP submission with full policy enforcement
  },
  'rfp_workflow.RfpWorkflow.approveBudget': async (params, auth) => {
    // Handles budget approval with business rule validation
  }
};
```

### 4. **Multi-IdP Agent Collaboration**
Agents from different organizations can collaborate securely:

```yaml
# Company A's agents use their own Keycloak
procurement_agent:
  environment:
    KEYCLOAK_URL: http://keycloak.company-a.com
    
# Company B's agents use their own Keycloak  
supplier_agent:
  environment:
    KEYCLOAK_URL: http://keycloak.company-b.com
    
# A2A Server trusts both IdPs
a2a_server:
  environment:
    TRUSTED_ISSUERS: "http://keycloak.company-a.com,http://keycloak.company-b.com"
```

## 🎯 **Current Status: Core Features Complete ✅**

✅ **Core Architecture Complete**
- Dynamic protocol deployment working
- Real-time method generation working  
- Multi-IdP authentication working
- Policy enforcement working
- Complete RFP workflow tested end-to-end

✅ **Key Features Working**
- **Zero-downtime protocol deployment**
- **Automatic A2A method generation**
- **Real-time protocol discovery**
- **Cross-organization agent collaboration**
- **Full audit trail of all interactions**

## 🧪 **Proven Use Case: RFP Workflow**

The system has been tested with a complete **Request for Proposal (RFP) workflow**:

```bash
🎉 RFP Workflow Test Results:
   draft → pendingApproval → approved → active
   ✅ All A2A method calls successful
   ✅ All state transitions completed
   ✅ Policy enforcement working
   ✅ Cross-agent communication working
   ✅ Full audit trail maintained

📊 Final State:
   RFP ID: rfp-a2a-1751160577228
   Protocol ID: f423ba18-780d-4339-ad07-4d4fe74769b8
   Final State: active
   Requested Amount: $75000
   Approved Amount: $75000
```

## 🚀 **Dynamic Protocol Deployment**

The system's core feature is **dynamic protocol deployment**:

### **How It Works**

1. **Protocol Discovery**: Automatically discovers deployed packages from NPL engine
2. **Method Generation**: Generates A2A methods from NPL protocol permissions
3. **Runtime Deployment**: Deploys new protocols without service restarts
4. **Real-time Refresh**: Updates method handlers automatically

### **API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/a2a/protocols` | GET | List deployed protocols and packages |
| `/a2a/deploy` | POST | Deploy new NPL protocols |
| `/a2a/refresh` | POST | Refresh A2A method handlers |
| `/a2a/skills` | GET | Get available agent skills |
| `/a2a/method` | POST | Execute A2A methods on protocols |

### **Example: Deploying a New Workflow**

```bash
# 1. Deploy a new invoice processing protocol
curl -X POST http://localhost:8000/a2a/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "package": "invoice_workflow",
    "protocol": "InvoiceProcessing",
    "nplCode": "package invoice_workflow\n\n@api\nprotocol[buyer, seller] InvoiceProcessing(var amount: Number) {\n  initial state created;\n  final state paid;\n  \n  @api\n  permission[buyer] approveInvoice() | created {\n    become paid;\n  };\n}",
    "token": "<jwt_token>"
  }'

# 2. Verify the protocol is deployed
curl -H "Authorization: Bearer <token>" http://localhost:8000/a2a/protocols

# 3. Check available skills (now includes invoice methods)
curl http://localhost:8000/a2a/skills

# 4. Use the new invoice methods
curl -X POST http://localhost:8000/a2a/method \
  -H "Content-Type: application/json" \
  -d '{
    "package": "invoice_workflow",
    "protocol": "InvoiceProcessing", 
    "method": "approveInvoice",
    "params": {"amount": 1000},
    "token": "<jwt_token>"
  }'
```

## 🛠️ **Quick Start**

### **Prerequisites**
- Docker and Docker Compose
- Node.js 18+ (for local development)

### **1. Start the Infrastructure**

```bash
# Clone and start all services
git clone <repository>
cd a2a
docker-compose up -d

# Verify services are running
docker-compose ps
```

### **2. Verify Services**

```bash
# Test A2A server
curl http://localhost:8000/health

# Test NPL engine  
curl http://localhost:12000/actuator/health

# Test Keycloak
curl http://localhost:11000/realms/noumena
```

### **3. Get Authentication Token**

```bash
# Get JWT token for testing
curl -X POST http://localhost:11000/realms/noumena/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=noumena&username=alice&password=password123"
```

### **4. Test Dynamic Protocol Deployment**

```bash
# List current protocols
curl -H "Authorization: Bearer <token>" http://localhost:8000/a2a/protocols

# Deploy a test protocol
curl -X POST http://localhost:8000/a2a/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "package": "test_workflow",
    "protocol": "TestProtocol",
    "nplCode": "package test_workflow\n\n@api\nprotocol[user] TestProtocol() {\n  initial state created;\n  final state completed;\n  \n  @api\n  permission[user] complete() | created {\n    become completed;\n  };\n}",
    "token": "<jwt_token>"
  }'

# Verify new methods are available
curl http://localhost:8000/a2a/skills
```

## 🏗️ **Architecture Deep Dive**

### **Component Responsibilities**

#### **A2A Server (Policy Hub)**
- **Dynamic Method Manager**: Discovers and loads protocol methods
- **Protocol Deployment**: Handles runtime protocol deployment
- **Method Routing**: Routes A2A calls to appropriate NPL handlers
- **Authentication**: Validates tokens from multiple IdPs
- **Code Generation**: Generates A2A methods from NPL OpenAPI specs

#### **NPL Engine (Policy Engine)**
- **Protocol Execution**: Runs NPL protocol instances
- **State Management**: Manages protocol state transitions
- **Policy Enforcement**: Enforces business rules and constraints
- **Audit Trail**: Logs all protocol interactions
- **OpenAPI Generation**: Exposes protocols as REST APIs

#### **Keycloak (Identity & Access)**
- **Multi-IdP Support**: Manages multiple identity providers
- **JWT Issuance**: Issues tokens for cross-organization access
- **Role Management**: Manages user and agent roles
- **Realm Isolation**: Provides organizational boundaries

### **Data Flow**

```
1. Agent Request → A2A Server
   ↓
2. Token Validation → Keycloak
   ↓  
3. Method Routing → Dynamic Method Manager
   ↓
4. Protocol Execution → NPL Engine
   ↓
5. Policy Enforcement → NPL Protocol Instance
   ↓
6. State Update → PostgreSQL
   ↓
7. Response → Agent
```

### **Security Model**

- **Multi-IdP Authentication**: Agents from different organizations use their own IdPs
- **JWT Token Validation**: A2A server validates tokens from trusted issuers
- **Protocol-Level Authorization**: NPL protocols enforce fine-grained permissions
- **Audit Trail**: All interactions are logged for compliance
- **State Isolation**: Protocol instances are isolated by party permissions

## 🧪 **Testing**

### **Run All Tests**

```bash
# Run complete test suite
cd tests
./run-tests.sh
```

### **Individual Tests**

```bash
# Test A2A discovery
node test_a2a_discovery.js

# Test RFP workflow
node test_a2a_rfp_flow.js

# Test dynamic deployment
node deploy-test-protocol.js

# Test agent communication
node test_agent_connection.js
```

## 🔧 **Development**

### **A2A Server Development**

```bash
cd a2a-server

# Install dependencies
npm install

# Development mode with live reload
npm run dev

# Generate methods from NPL OpenAPI
node generate-a2a-methods.js

# Build for production
npm run build
```

### **Adding New Agents**

```bash
# Create new agent
mkdir new-agent
cd new-agent

# Copy structure from existing agent
cp -r ../procurement-agent/* .

# Update configuration
# - Update package.json
# - Update docker-compose.yml
# - Implement agent-specific skills
```

### **NPL Protocol Development**

```npl
package my_workflow

@api
protocol[party1, party2] MyProtocol(var param: Number) {
    initial state created;
    final state completed;

    @api
    permission[party1] startProcess() | created {
        require(param > 0, "Parameter must be positive");
        become processing;
    };

    @api
    permission[party2] complete() | processing {
        become completed;
    };
}
```

## 📊 **Performance & Scalability**

### **Current Performance**
- **Protocol Deployment**: < 5 seconds
- **Method Generation**: < 2 seconds  
- **A2A Method Execution**: < 100ms
- **Concurrent Agents**: Tested with 10+ agents
- **Protocol Instances**: 1000+ instances supported

### **Scalability Features**
- **Horizontal Scaling**: A2A servers can be scaled independently
- **Database Scaling**: PostgreSQL can be clustered
- **Load Balancing**: Multiple NPL engines supported
- **Caching**: Method handlers cached for performance
- **Async Processing**: Non-blocking protocol execution

## 🤝 **Contributing**

### **Development Setup**

```bash
# Fork and clone
git clone <your-fork>
cd a2a

# Install dependencies
npm install

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run tests
npm test
```

### **Code Standards**
- **TypeScript**: All new code in TypeScript
- **NPL Protocols**: Follow NPL best practices
- **Testing**: 90%+ test coverage required
- **Documentation**: Update README for new features

## 📄 **License**

MIT License - see LICENSE file for details.

## 🙏 **Acknowledgments**

- **Google A2A Team**: For the Agent2Agent protocol specification
- **Noumena Digital**: For the NPL language and runtime
- **Keycloak Community**: For the identity management platform

---

This project demonstrates that **policy-driven, dynamic agent workflows** are practical and powerful. The combination of A2A protocols, NPL policy enforcement, and dynamic deployment creates a new paradigm for business process automation. 