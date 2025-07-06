terraform {
  required_providers {
    keycloak = {
      source  = "mrparkers/keycloak"
      version = "~> 4.0"
    }
  }
  
  # Store state locally for simplicity
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "keycloak" {
  client_id     = "admin-cli"
  username      = "admin"
  password      = "admin"
  url           = "http://keycloak:11000"
  initial_login = true
  
  # Retry configuration for reliability
  client_timeout = 30
}

# Create the noumena realm
resource "keycloak_realm" "noumena" {
  realm   = "noumena"
  enabled = true
  
  # Realm settings
  display_name = "Noumena Platform"
  display_name_html = "<div class=\"kc-logo-text\"><span>Noumena</span></div>"
  
  # Security settings
  ssl_required = "external"
  password_policy = "length(8) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1)"
  
  # Session settings
  sso_session_idle_timeout = "1800s"
  sso_session_max_lifespan = "36000s"
  offline_session_idle_timeout = "2592000s"
  offline_session_max_lifespan = "5184000s"
  
  # Token settings
  access_token_lifespan = "300s"
  client_session_idle_timeout = 0
  client_session_max_lifespan = 0
}

# Create the main public client for applications
resource "keycloak_openid_client" "noumena_public" {
  realm_id  = keycloak_realm.noumena.id
  client_id = "noumena"
  
  enabled                  = true
  access_type             = "PUBLIC"
  standard_flow_enabled   = true
  direct_access_grants_enabled = true
  service_accounts_enabled = false
  
  # Redirect URIs for applications
  valid_redirect_uris = [
    "http://localhost:12000/*",
    "http://localhost:15000/*",
    "http://localhost:8000/*"
  ]
  
  # Web origins for CORS
  web_origins = ["*"]
  
  # Client settings
  client_authenticator_type = "client-secret"
  use_refresh_tokens = true
}

# Create the NPL CLI client
resource "keycloak_openid_client" "npl_cli" {
  realm_id  = keycloak_realm.noumena.id
  client_id = "npl-cli"
  
  enabled                  = true
  access_type             = "CONFIDENTIAL"
  standard_flow_enabled   = false
  direct_access_grants_enabled = true
  service_accounts_enabled = true
  
  # Client secret
  client_secret = "npl-cli-secret"
  
  # Client settings
  client_authenticator_type = "client-secret"
  use_refresh_tokens = true
}

# Create the A2A service client
resource "keycloak_openid_client" "a2a_service" {
  realm_id  = keycloak_realm.noumena.id
  client_id = "a2a-service"
  
  enabled                  = true
  access_type             = "CONFIDENTIAL"
  standard_flow_enabled   = false
  direct_access_grants_enabled = true
  service_accounts_enabled = true
  
  # Client secret
  client_secret = "a2a-service-secret"
  
  # Client settings
  client_authenticator_type = "client-secret"
  use_refresh_tokens = true
}

# Create user roles
resource "keycloak_role" "buyer_role" {
  realm_id = keycloak_realm.noumena.id
  name     = "buyer"
  description = "Buyer role for procurement activities"
}

resource "keycloak_role" "supplier_role" {
  realm_id = keycloak_realm.noumena.id
  name     = "supplier"
  description = "Supplier role for vendor activities"
}

resource "keycloak_role" "finance_manager_role" {
  realm_id = keycloak_realm.noumena.id
  name     = "finance_manager"
  description = "Finance manager role for budget and payment activities"
}

resource "keycloak_role" "agent_role" {
  realm_id = keycloak_realm.noumena.id
  name     = "agent"
  description = "Agent role for automated systems"
}

resource "keycloak_role" "technical_user_role" {
  realm_id = keycloak_realm.noumena.id
  name     = "technical_user"
  description = "Technical user role for system operations"
}

# Create users
resource "keycloak_user" "buyer" {
  realm_id = keycloak_realm.noumena.id
  username = "buyer"
  enabled  = true
  
  email      = "buyer@company.com"
  first_name = "John"
  last_name  = "Buyer"
  
  email_verified = true
  
  initial_password {
    value     = "Buyer123!"
    temporary = false
  }
  
  attributes = {
    role         = "buyer"
    organization = "company-a"
    department   = "procurement"
    permissions  = "create_rfp,review_proposals,approve_contracts"
  }
}

resource "keycloak_user" "supplier" {
  realm_id = keycloak_realm.noumena.id
  username = "supplier"
  enabled  = true
  
  email      = "supplier@vendor.com"
  first_name = "Jane"
  last_name  = "Supplier"
  
  email_verified = true
  
  initial_password {
    value     = "Supplier123!"
    temporary = false
  }
  
  attributes = {
    role           = "supplier"
    organization   = "vendor-b"
    specialization = "software-development"
    permissions    = "view_rfps,submit_proposals,track_deliveries"
  }
}

resource "keycloak_user" "finance_manager" {
  realm_id = keycloak_realm.noumena.id
  username = "finance_manager"
  enabled  = true
  
  email      = "finance@company.com"
  first_name = "Mike"
  last_name  = "Finance"
  
  email_verified = true
  
  initial_password {
    value     = "FinanceManager123!"
    temporary = false
  }
  
  attributes = {
    role         = "finance_manager"
    organization = "company-a"
    department   = "finance"
    permissions  = "approve_budgets,process_payments,financial_reports"
  }
}

resource "keycloak_user" "procurement_agent" {
  realm_id = keycloak_realm.noumena.id
  username = "procurement_agent"
  enabled  = true
  
  email      = "procurement-agent@company.com"
  first_name = "Procurement"
  last_name  = "Agent"
  
  email_verified = true
  
  initial_password {
    value     = "ProcurementAgent123!"
    temporary = false
  }
  
  attributes = {
    role         = "agent"
    agent_type   = "procurement"
    organization = "company-a"
    capabilities = "rfp_creation,proposal_evaluation,contract_management"
    api_endpoint = "http://localhost:3001/api"
    permissions  = "automated_rfp_creation,proposal_analysis,contract_generation"
  }
}

resource "keycloak_user" "finance_agent" {
  realm_id = keycloak_realm.noumena.id
  username = "finance_agent"
  enabled  = true
  
  email      = "finance-agent@company.com"
  first_name = "Finance"
  last_name  = "Agent"
  
  email_verified = true
  
  initial_password {
    value     = "FinanceAgent123!"
    temporary = false
  }
  
  attributes = {
    role         = "agent"
    agent_type   = "finance"
    organization = "company-a"
    capabilities = "budget_approval,payment_processing,financial_analysis"
    api_endpoint = "http://localhost:3002/api"
    permissions  = "automated_budget_approval,payment_processing,financial_reporting"
  }
}

resource "keycloak_user" "supplier_agent" {
  realm_id = keycloak_realm.noumena.id
  username = "supplier_agent"
  enabled  = true
  
  email      = "supplier-agent@vendor.com"
  first_name = "Supplier"
  last_name  = "Agent"
  
  email_verified = true
  
  initial_password {
    value     = "SupplierAgent123!"
    temporary = false
  }
  
  attributes = {
    role         = "agent"
    agent_type   = "supplier"
    organization = "vendor-b"
    capabilities = "proposal_generation,delivery_tracking,invoicing"
    api_endpoint = "http://localhost:3003/api"
    permissions  = "automated_proposal_generation,delivery_tracking,invoice_processing"
  }
}

resource "keycloak_user" "a2a_technical_user" {
  realm_id = keycloak_realm.noumena.id
  username = "a2a-technical-user"
  enabled  = true
  
  email      = "a2a-technical@noumena.local"
  first_name = "A2A"
  last_name  = "Technical"
  
  email_verified = true
  
  initial_password {
    value     = "A2ATechUser123!"
    temporary = false
  }
  
  attributes = {
    role         = "technical_user"
    organization = "noumena"
    department   = "platform"
    permissions  = "admin_access,protocol_discovery,system_management"
    user_type    = "technical"
    service      = "a2a_server"
  }
}

# Assign roles to users
resource "keycloak_user_roles" "buyer_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.buyer.id
  
  role_ids = [
    keycloak_role.buyer_role.id
  ]
}

resource "keycloak_user_roles" "supplier_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.supplier.id
  
  role_ids = [
    keycloak_role.supplier_role.id
  ]
}

resource "keycloak_user_roles" "finance_manager_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.finance_manager.id
  
  role_ids = [
    keycloak_role.finance_manager_role.id
  ]
}

resource "keycloak_user_roles" "procurement_agent_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.procurement_agent.id
  
  role_ids = [
    keycloak_role.agent_role.id
  ]
}

resource "keycloak_user_roles" "finance_agent_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.finance_agent.id
  
  role_ids = [
    keycloak_role.agent_role.id
  ]
}

resource "keycloak_user_roles" "supplier_agent_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.supplier_agent.id
  
  role_ids = [
    keycloak_role.agent_role.id
  ]
}

resource "keycloak_user_roles" "a2a_technical_user_roles" {
  realm_id = keycloak_realm.noumena.id
  user_id  = keycloak_user.a2a_technical_user.id
  
  role_ids = [
    keycloak_role.technical_user_role.id
  ]
}

# Outputs for reference
output "realm_id" {
  value = keycloak_realm.noumena.id
}

output "a2a_service_client_id" {
  value = keycloak_openid_client.a2a_service.client_id
}

output "a2a_service_client_secret" {
  value     = keycloak_openid_client.a2a_service.client_secret
  sensitive = true
}

output "users_created" {
  value = [
    keycloak_user.buyer.username,
    keycloak_user.supplier.username,
    keycloak_user.finance_manager.username,
    keycloak_user.procurement_agent.username,
    keycloak_user.finance_agent.username,
    keycloak_user.supplier_agent.username,
    keycloak_user.a2a_technical_user.username
  ]
} 