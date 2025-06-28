# Agent2Agent NPL Runtime with Keycloak IAM

A production-ready NPL (Noumena Protocol Language) runtime setup for building secure, policy-driven agent-to-agent applications with fine-grained authorization.

## 🎯 Overview

This project provides a complete infrastructure for building agent2agent applications using:
- **NPL Engine** - Protocol execution runtime
- **Keycloak IAM** - Enterprise-grade identity and access management
- **Postgres** - Persistent storage
- **Docker Compose** - Local development environment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Agent Apps    │    │   Keycloak      │    │   NPL Engine    │
│                 │◄──►│   IAM Server    │◄──►│   Runtime       │
│                 │    │   (Port 11000)  │    │   (Port 12000)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │   Postgres      │
                                              │   Database      │
                                              │   (Port 5432)   │
                                              └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- NPL CLI (optional, for deployment)
- `jq` for JSON processing

### 1. Start the Runtime
```bash
docker compose up -d
```

### 2. Verify Services
```bash
# Check all containers are running
docker compose ps

# Test engine health
curl http://localhost:12000/actuator/health

# Test Keycloak realm
curl http://localhost:11000/realms/noumena/.well-known/openid-configuration
```

### 3. Get Authentication Token
```bash
export TOKEN=$(curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=noumena" \
  -d "grant_type=password" \
  -d "username=alice" \
  -d "password=password123" \
  "http://localhost:11000/realms/noumena/protocol/openid-connect/token" \
  | jq -r '.access_token')
```

### 4. Access Swagger UI
Open [http://localhost:12000/swagger-ui/](http://localhost:12000/swagger-ui/) in your browser and:
1. Click "Authorize"
2. Paste your JWT token
3. Explore the NPL API endpoints

## 🔧 Configuration

### Keycloak Setup
- **Admin Console**: [http://localhost:11000/](http://localhost:11000/) (admin/admin)
- **Realm**: `noumena` (auto-imported)
- **Client**: `noumena` (public client)
- **User**: `alice` (password: `password123`)

### Environment Variables
Key configuration in `docker-compose.yml`:
- `ENGINE_ALLOWED_ISSUERS`: Keycloak realm URL
- `ENGINE_DB_URL`: Postgres connection string
- `SWAGGER_SECURITY_*`: Swagger UI authentication

## 📁 Project Structure
```
├── docker-compose.yml              # Service orchestration
├── keycloak-complete-realm.json    # Keycloak realm configuration
├── src/main/npl-1.0.0/demo/       # NPL source code
├── .npl/deploy.yml                 # NPL CLI configuration
└── a2a-specs.md                   # Agent2Agent use case specification
```

## 🎯 Use Cases

This setup is designed for building:
- **Multi-agent workflows** with policy enforcement
- **Enterprise-grade agent collaboration** with audit trails
- **Secure agent-to-agent communication** with fine-grained authorization
- **Compliance-driven agent ecosystems** with NPL policy engine

## 🔒 Security Features

- **OAuth2/JWT Authentication** via Keycloak
- **Fine-grained authorization** via NPL policies
- **Audit trails** for all agent interactions
- **State-aware permissions** based on workflow status
- **Role-based access control** with business constraints

## 🛠️ Development

### Adding New Users
Edit `keycloak-complete-realm.json` and restart:
```bash
docker compose down
docker compose up -d
```

### Deploying NPL Code
Currently using manual deployment via REST API. NPL CLI deployment is being configured.

### Testing
```bash
# Test authentication
curl -H "Authorization: Bearer $TOKEN" http://localhost:12000/actuator/health

# Test API endpoints via Swagger UI
# Open http://localhost:12000/swagger-ui/
```

## 📚 Documentation

- [NPL Language Reference](https://documentation.noumenadigital.com/)
- [Keycloak Setup Guide](https://documentation.noumenadigital.com/howto/using-IAM-keycloak/)
- [Agent2Agent Use Case Specification](./a2a-specs.md)

## 🤝 Support

For questions and community support:
- [NOUMENA Community](https://community.noumenadigital.com/)
- [NPL Documentation](https://documentation.noumenadigital.com/)

---

**Ready to build your agent2agent applications! 🚀**
