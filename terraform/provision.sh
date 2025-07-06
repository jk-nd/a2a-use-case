#!/bin/bash

# Terraform Keycloak Provisioning Script
# This script provisions Keycloak using Terraform for reliable, repeatable deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KEYCLOAK_URL="http://keycloak:11000"
TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/terraform-keycloak.log"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to wait for Keycloak to be ready
wait_for_keycloak() {
    log "Waiting for Keycloak to be ready..."
    
    # Use the internal Docker hostname and simple until loop like the working example
    until curl -s --fail http://keycloak:11000/realms/master > /dev/null 2>&1; do
        log "Keycloak is not ready - sleeping 2s"
        sleep 2
    done
    
    success "Keycloak is ready!"
}

# Function to check if Terraform is installed
check_terraform() {
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed. Please install Terraform first."
    fi
    
    local version=$(terraform version -json | jq -r '.terraform_version')
    log "Using Terraform version: $version"
}

# Function to initialize Terraform
init_terraform() {
    log "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    
    if ! terraform init; then
        error "Terraform initialization failed"
    fi
    
    success "Terraform initialized successfully"
}

# Function to validate Terraform configuration
validate_terraform() {
    log "Validating Terraform configuration..."
    cd "$TERRAFORM_DIR"
    
    if ! terraform validate; then
        error "Terraform validation failed"
    fi
    
    success "Terraform configuration is valid"
}

# Function to plan Terraform changes
plan_terraform() {
    log "Planning Terraform changes..."
    cd "$TERRAFORM_DIR"
    
    if ! terraform plan -out=tfplan; then
        error "Terraform plan failed"
    fi
    
    success "Terraform plan created successfully"
}

# Function to apply Terraform changes
apply_terraform() {
    log "Applying Terraform changes..."
    cd "$TERRAFORM_DIR"
    
    # Check if realm already exists
    if curl -s "$KEYCLOAK_URL/realms/noumena" > /dev/null 2>&1; then
        log "Realm 'noumena' already exists, importing existing resources..."
        
        # Import existing realm
        if terraform import keycloak_realm.noumena noumena; then
            success "Existing realm imported successfully"
        else
            warning "Failed to import existing realm (continuing anyway)"
        fi
        
        # Try to import existing clients if they exist
        local admin_token=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
            -H 'Content-Type: application/x-www-form-urlencoded' \
            -d 'username=admin&password=admin&grant_type=password&client_id=admin-cli' \
            | jq -r '.access_token')
        
        if [ "$admin_token" != "null" ] && [ -n "$admin_token" ]; then
            # Try to import a2a-service client
            local client_id=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/noumena/clients" \
                -H "Authorization: Bearer $admin_token" \
                | jq -r '.[] | select(.clientId == "a2a-service") | .id')
            
            if [ "$client_id" != "null" ] && [ -n "$client_id" ]; then
                if terraform import keycloak_openid_client.a2a_service "$client_id"; then
                    success "Existing a2a-service client imported successfully"
                else
                    warning "Failed to import existing a2a-service client (continuing anyway)"
                fi
            fi
        fi
    fi
    
    # Apply changes (this will create missing resources and update existing ones)
    if ! terraform apply -auto-approve; then
        error "Terraform apply failed"
    fi
    
    success "Terraform changes applied successfully"
}

# Function to verify the deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if realm exists, retry up to 30s
    local realm_found=0
    for i in {1..15}; do
        if curl -s "$KEYCLOAK_URL/realms/noumena" > /dev/null; then
            realm_found=1
            break
        fi
        log "Waiting for realm 'noumena' to become available... ($i/15)"
        sleep 2
    done
    if [ $realm_found -eq 0 ]; then
        error "Realm 'noumena' not found after deployment (timed out)"
    fi
    
    # Check if a2a-service client exists
    local admin_token=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -d 'username=admin&password=admin&grant_type=password&client_id=admin-cli' \
        | jq -r '.access_token')
    
    if [ "$admin_token" = "null" ] || [ -z "$admin_token" ]; then
        error "Failed to get admin token for verification"
    fi
    
    local clients_response=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/noumena/clients" \
        -H "Authorization: Bearer $admin_token")
    
    if echo "$clients_response" | jq -e '.[] | select(.clientId == "a2a-service")' > /dev/null; then
        success "a2a-service client found"
    else
        error "a2a-service client not found after deployment"
    fi
    
    # Check if users exist
    local users_response=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/noumena/users" \
        -H "Authorization: Bearer $admin_token")
    
    local expected_users=("buyer" "supplier" "finance_manager" "procurement_agent" "finance_agent" "supplier_agent" "a2a-technical-user")
    
    for user in "${expected_users[@]}"; do
        if echo "$users_response" | jq -e ".[] | select(.username == \"$user\")" > /dev/null; then
            log "User '$user' found"
        else
            warning "User '$user' not found after deployment"
        fi
    done
    
    success "Deployment verification completed"
}

# Function to show Terraform outputs
show_outputs() {
    log "Terraform outputs:"
    cd "$TERRAFORM_DIR"
    terraform output
}

# Function to clean up
cleanup() {
    log "Cleaning up..."
    cd "$TERRAFORM_DIR"
    rm -f tfplan
    success "Cleanup completed"
}

# Main execution
main() {
    log "Starting Terraform Keycloak provisioning..."
    
    # Check prerequisites
    check_terraform
    
    # Wait for Keycloak
    wait_for_keycloak
    
    # Initialize and validate
    init_terraform
    validate_terraform
    
    # Plan and apply
    plan_terraform
    apply_terraform
    
    # Verify deployment
    verify_deployment
    
    # Show outputs
    show_outputs
    
    # Cleanup
    cleanup
    
    success "Keycloak provisioning completed successfully!"
    log "You can now use the A2A service with the configured clients and users."
}

# Handle script arguments
case "${1:-}" in
    "init")
        check_terraform
        wait_for_keycloak
        init_terraform
        ;;
    "validate")
        check_terraform
        validate_terraform
        ;;
    "plan")
        check_terraform
        wait_for_keycloak
        init_terraform
        plan_terraform
        ;;
    "apply")
        check_terraform
        wait_for_keycloak
        init_terraform
        plan_terraform
        apply_terraform
        verify_deployment
        show_outputs
        ;;
    "verify")
        verify_deployment
        ;;
    "outputs")
        show_outputs
        ;;
    "destroy")
        log "Destroying Terraform resources..."
        cd "$TERRAFORM_DIR"
        terraform destroy -auto-approve
        success "Resources destroyed"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize Terraform"
        echo "  validate - Validate Terraform configuration"
        echo "  plan     - Plan Terraform changes"
        echo "  apply    - Apply Terraform changes"
        echo "  verify   - Verify deployment"
        echo "  outputs  - Show Terraform outputs"
        echo "  destroy  - Destroy all resources"
        echo "  help     - Show this help message"
        echo ""
        echo "If no command is provided, runs the full provisioning process."
        ;;
    "")
        main
        ;;
    *)
        error "Unknown command: $1. Use 'help' for usage information."
        ;;
esac 