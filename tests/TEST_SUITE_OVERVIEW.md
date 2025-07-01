# A2A Test Suite Overview

This document provides a comprehensive overview of the test suite and what functionality each test validates.

## 🎯 **Test Suite Purpose**

The test suite validates the complete A2A (Agent2Agent) system with NPL (NOUMENA Protocol Language) integration, ensuring:

- **Dynamic Protocol Deployment** - New protocols can be deployed at runtime
- **Real-time Method Generation** - A2A methods are automatically generated from NPL protocols
- **Multi-IdP Authentication** - Cross-organization authentication works
- **Policy Enforcement** - Business rules are enforced through NPL protocols
- **Cross-agent Communication** - Agents can collaborate securely
- **Full Audit Trail** - All interactions are logged and traceable

## 📋 **Test Files and Functionality**

### **Phase 1: Basic Infrastructure Tests**

#### `test_a2a_client.js`
**Purpose**: Basic connectivity and endpoint validation
**Tests**:
- ✅ A2A server health endpoint
- ✅ Agent card endpoint (metadata)
- ✅ A2A request endpoint structure
- ✅ Basic error handling

**Functionality Verified**:
- A2A server is running and accessible
- Core endpoints are responding
- Basic request/response structure works

---

### **Phase 2: Protocol Discovery and Management Tests**

#### `test_a2a_discovery.js`
**Purpose**: Protocol discovery and listing functionality
**Tests**:
- ✅ JWT token authentication
- ✅ Protocol instance creation
- ✅ Protocol discovery for different agents
- ✅ Protocol listing and filtering
- ✅ Multi-instance management

**Functionality Verified**:
- Authentication with Keycloak works
- NPL engine integration works
- Protocol instances can be created
- Agents can discover their protocols
- Protocol state management works

---

### **Phase 3: Dynamic Protocol Deployment Tests**

#### `deploy-test-protocol.js`
**Purpose**: Dynamic protocol deployment via A2A server
**Tests**:
- ✅ Deploy new NPL protocols at runtime
- ✅ Method generation from deployed protocols
- ✅ Protocol refresh and discovery
- ✅ New protocol instantiation
- ✅ Method execution on new protocols

**Functionality Verified**:
- Dynamic protocol deployment works
- Method generation is automatic
- New protocols become available immediately
- Protocol instantiation with JWT claims works

#### `deploy-auto-discovery.js`
**Purpose**: Auto-discovery functionality
**Tests**:
- ✅ Automatic protocol discovery
- ✅ Method availability after deployment
- ✅ Skills generation from new protocols
- ✅ Real-time protocol updates

**Functionality Verified**:
- Auto-discovery mechanism works
- New protocols are automatically detected
- Method handlers are generated correctly
- Skills are updated in real-time

---

### **Phase 4: End-to-End Workflow Tests**

#### `test_rfp_deployment_and_workflow.js`
**Purpose**: Complete RFP workflow validation
**Tests**:
- ✅ RFP protocol deployment
- ✅ Protocol instantiation with parties
- ✅ State transitions (draft → pendingApproval → approved → active)
- ✅ Cross-agent communication
- ✅ Policy enforcement
- ✅ Error handling
- ✅ Audit trail validation

**Functionality Verified**:
- Complete business workflow works
- State transitions are enforced
- Policy rules are applied
- Cross-agent collaboration works
- Full audit trail is maintained

---

### **Phase 5: Multi-Party and Security Tests**

#### `test-protocol-instantiation.js`
**Purpose**: Multi-party protocol instantiation and security
**Tests**:
- ✅ Multi-party JWT validation
- ✅ Atomic protocol instantiation
- ✅ Party binding validation
- ✅ Access control verification
- ✅ Error handling for invalid tokens
- ✅ Security boundary enforcement

**Functionality Verified**:
- Multi-party consent works
- JWT validation is secure
- Party bindings are correct
- Access control is enforced
- Security boundaries are maintained

---

## 🚀 **Running the Test Suite**

### **Complete Test Suite**
```bash
cd tests
./run-tests.js
```

### **Individual Tests**
```bash
# Basic connectivity
node test_a2a_client.js

# Protocol discovery
node test_a2a_discovery.js

# Dynamic deployment
node deploy-test-protocol.js

# Auto-discovery
node deploy-auto-discovery.js

# End-to-end workflow
node test_rfp_deployment_and_workflow.js

# Multi-party security
node test-protocol-instantiation.js
```

### **Test Dependencies**
- A2A server running on port 8000
- NPL engine running on port 12000
- Keycloak running on port 11000
- Users provisioned via `keycloak-provisioning.sh`
- `axios` package installed

---

## 🎯 **System Functionality Coverage**

| Functionality | Test Coverage | Status |
|---------------|---------------|---------|
| **Dynamic Protocol Deployment** | `deploy-test-protocol.js` | ✅ Complete |
| **Real-time Method Generation** | `deploy-auto-discovery.js` | ✅ Complete |
| **Multi-IdP Authentication** | All tests | ✅ Complete |
| **Policy Enforcement** | `test_rfp_deployment_and_workflow.js` | ✅ Complete |
| **Cross-agent Communication** | `test_a2a_discovery.js` | ✅ Complete |
| **Protocol Discovery** | `test_a2a_discovery.js` | ✅ Complete |
| **Multi-party Security** | `test-protocol-instantiation.js` | ✅ Complete |
| **Error Handling** | All tests | ✅ Complete |
| **Audit Trail** | `test_rfp_deployment_and_workflow.js` | ✅ Complete |

---

## 🔧 **Test Configuration**

### **Environment Variables**
- `A2A_SERVER_URL` - A2A server URL (default: http://localhost:8000)
- `NPL_ENGINE_URL` - NPL engine URL (default: http://localhost:12000)
- `KEYCLOAK_URL` - Keycloak URL (default: http://localhost:11000)
- `KEYCLOAK_REALM` - Keycloak realm (default: noumena)

### **Test Users**
- `buyer` / `password123` - Procurement agent
- `finance_manager` / `password123` - Finance agent
- `procurement_agent` / `agent-password-123` - Agent user
- `finance_agent` / `agent-password-123` - Agent user

### **Test Protocols**
- `rfp_workflow.RfpWorkflow` - Main RFP workflow
- `test_deploy.TestProtocol` - Dynamic deployment test
- `auto_discovery.AutoTest` - Auto-discovery test

---

## 📊 **Test Results Interpretation**

### **Success Indicators**
- ✅ All tests pass without errors
- ✅ Protocol deployments succeed
- ✅ State transitions complete correctly
- ✅ Authentication works for all users
- ✅ Method generation is automatic
- ✅ Cross-agent communication works

### **Failure Indicators**
- ❌ Connection refused errors (services not running)
- ❌ Authentication failures (Keycloak issues)
- ❌ Protocol deployment failures (NPL engine issues)
- ❌ Method not found errors (generation issues)
- ❌ State transition failures (policy violations)

### **Troubleshooting**
1. **Service Issues**: Check `docker-compose ps`
2. **Authentication**: Verify Keycloak provisioning
3. **Protocol Issues**: Check NPL engine logs
4. **Method Issues**: Check A2A server logs
5. **Token Issues**: Regenerate tokens with `get-token.js`

---

## 🎉 **Conclusion**

The test suite provides comprehensive coverage of the A2A system functionality, ensuring that all core features work correctly:

- **Dynamic deployment** allows new protocols at runtime
- **Real-time generation** creates A2A methods automatically
- **Multi-IdP authentication** enables cross-organization collaboration
- **Policy enforcement** ensures business rule compliance
- **Cross-agent communication** enables secure collaboration
- **Full audit trail** maintains compliance and traceability

The system is **fully functional** and ready for production use! 🚀 