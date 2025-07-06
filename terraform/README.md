# Terraform Keycloak Provisioning

This directory contains the Terraform configuration for provisioning Keycloak with the Noumena platform setup.

## Overview

Instead of using fragile JSON imports, this system uses Terraform to:
- Create the `noumena` realm
- Configure clients (noumena, npl-cli, a2a-service)
- Create users with proper roles and attributes
- Ensure idempotent, reliable deployments

## Prerequisites

- Docker and Docker Compose
- Terraform (if running locally)
- Keycloak running on `http://localhost:11000`

## Quick Start

### Using Docker (Recommended)

The Terraform provisioning is integrated into the Docker Compose setup:

```bash
# Start the entire stack including Terraform provisioning
docker-compose up -d

# Check provisioning status
docker-compose logs keycloak-provisioning
```

### Manual Execution

If you need to run Terraform manually:

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
./provision.sh init

# Plan changes
./provision.sh plan

# Apply changes
./provision.sh apply

# Verify deployment
./provision.sh verify
```

## Configuration

### Main Configuration (`main.tf`)

The main Terraform configuration includes:

- **Realm**: `noumena` with security and session settings
- **Clients**: 
  - `noumena` (public client for applications)
  - `npl-cli` (confidential client for CLI tools)
  - `a2a-service` (confidential client for A2A service)
- **Users**: All platform users with roles and attributes
- **Roles**: buyer, supplier, finance_manager, agent, technical_user

### Users Created

| Username | Role | Organization | Purpose |
|----------|------|--------------|---------|
| `buyer` | buyer | company-a | Human buyer user |
| `supplier` | supplier | vendor-b | Human supplier user |
| `finance_manager` | finance_manager | company-a | Human finance manager |
| `procurement_agent` | agent | company-a | Automated procurement agent |
| `finance_agent` | agent | company-a | Automated finance agent |
| `supplier_agent` | agent | vendor-b | Automated supplier agent |
| `a2a-technical-user` | technical_user | noumena | Technical user for A2A service |

## Script Commands

The `provision.sh` script supports several commands:

```bash
./provision.sh init      # Initialize Terraform
./provision.sh validate  # Validate configuration
./provision.sh plan      # Plan changes
./provision.sh apply     # Apply changes
./provision.sh verify    # Verify deployment
./provision.sh outputs   # Show Terraform outputs
./provision.sh destroy   # Destroy all resources
./provision.sh help      # Show help
```

## Benefits Over JSON Import

### ✅ **Reliability**
- **Idempotent**: Run multiple times safely
- **State Management**: Terraform tracks what's deployed
- **Error Recovery**: Failed deployments can be resumed
- **Validation**: Configuration validated before deployment

### ✅ **Maintainability**
- **Declarative**: Describe desired state, not how to get there
- **Version Control**: Changes tracked in Git
- **Modular**: Easy to add/remove components
- **Documentation**: Self-documenting configuration

### ✅ **Debugging**
- **Clear Error Messages**: Specific failure points
- **Plan Preview**: See changes before applying
- **State Inspection**: Current deployment state
- **Logging**: Detailed operation logs

## Troubleshooting

### Common Issues

1. **Keycloak Not Ready**
   ```bash
   # Check Keycloak health
   curl http://localhost:11000/health/ready
   
   # Wait for Keycloak to be ready
   ./provision.sh init
   ```

2. **Terraform State Issues**
   ```bash
   # Remove state and reinitialize
   rm -f terraform.tfstate*
   ./provision.sh init
   ```

3. **Client Secret Issues**
   ```bash
   # Check client configuration
   ./provision.sh outputs
   ```

### Logs

- **Terraform Logs**: `/tmp/terraform-keycloak.log`
- **Docker Logs**: `docker-compose logs keycloak-provisioning`

## Security Notes

- **Client Secrets**: Stored in Terraform state (sensitive)
- **Passwords**: All users have default passwords (change in production)
- **SSL**: Configured for external SSL requirement
- **Session Timeouts**: Configured for security

## Production Considerations

For production deployment:

1. **Remote State**: Use remote state storage (S3, Azure, GCS)
2. **Secrets Management**: Use Terraform Cloud or external secret management
3. **Password Policy**: Enforce strong password policies
4. **SSL/TLS**: Configure proper SSL certificates
5. **Backup**: Implement regular state and Keycloak backups

## Integration with A2A Service

The A2A service uses the `a2a-service` client for authentication:

```typescript
// Environment variables for A2A service
A2A_CLIENT_ID=a2a-service
A2A_CLIENT_SECRET=a2a-service-secret
```

The service can now authenticate and refresh tokens automatically using the TokenManager. 