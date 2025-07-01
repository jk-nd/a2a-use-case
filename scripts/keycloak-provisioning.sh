#!/bin/sh

echo 'Waiting for Keycloak to be ready...'
while ! curl -s http://keycloak:11000/health/ready > /dev/null; do
  sleep 2
done

echo 'Keycloak is ready, waiting a bit more for full startup...'
sleep 10

echo 'Getting admin token...'
TOKEN_RESPONSE=$(curl -s -X POST http://keycloak:11000/realms/master/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=admin&grant_type=password&client_id=admin-cli')
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo 'Creating realm configuration...'
cat > /tmp/realm-config.json << 'EOF'
{
  "realm": "noumena",
  "enabled": true,
  "users": [
    {
      "username": "buyer",
      "enabled": true,
      "emailVerified": true,
      "email": "buyer@company.com",
      "firstName": "John",
      "lastName": "Buyer",
      "credentials": [
        {
          "type": "password",
          "value": "password123",
          "temporary": false
        }
      ],
      "attributes": {
        "role": ["buyer"],
        "organization": ["company-a"],
        "department": ["procurement"],
        "permissions": ["create_rfp", "review_proposals", "approve_contracts"]
      }
    },
    {
      "username": "supplier",
      "enabled": true,
      "emailVerified": true,
      "email": "supplier@vendor.com",
      "firstName": "Jane",
      "lastName": "Supplier",
      "credentials": [
        {
          "type": "password",
          "value": "password123",
          "temporary": false
        }
      ],
      "attributes": {
        "role": ["supplier"],
        "organization": ["vendor-b"],
        "specialization": ["software-development"],
        "permissions": ["view_rfps", "submit_proposals", "track_deliveries"]
      }
    },
    {
      "username": "finance_manager",
      "enabled": true,
      "emailVerified": true,
      "email": "finance@company.com",
      "firstName": "Mike",
      "lastName": "Finance",
      "credentials": [
        {
          "type": "password",
          "value": "password123",
          "temporary": false
        }
      ],
      "attributes": {
        "role": ["finance_manager"],
        "organization": ["company-a"],
        "department": ["finance"],
        "permissions": ["approve_budgets", "process_payments", "financial_reports"]
      }
    },
    {
      "username": "procurement_agent",
      "enabled": true,
      "emailVerified": true,
      "email": "procurement-agent@company.com",
      "firstName": "Procurement",
      "lastName": "Agent",
      "credentials": [
        {
          "type": "password",
          "value": "agent-password-123",
          "temporary": false
        }
      ],
      "attributes": {
        "role": ["agent"],
        "agent_type": ["procurement"],
        "organization": ["company-a"],
        "capabilities": ["rfp_creation", "proposal_evaluation", "contract_management"],
        "api_endpoint": ["http://localhost:3001/api"],
        "permissions": ["automated_rfp_creation", "proposal_analysis", "contract_generation"]
      }
    },
    {
      "username": "finance_agent",
      "enabled": true,
      "emailVerified": true,
      "email": "finance-agent@company.com",
      "firstName": "Finance",
      "lastName": "Agent",
      "credentials": [
        {
          "type": "password",
          "value": "agent-password-123",
          "temporary": false
        }
      ],
      "attributes": {
        "role": ["agent"],
        "agent_type": ["finance"],
        "organization": ["company-a"],
        "capabilities": ["budget_approval", "payment_processing", "financial_analysis"],
        "api_endpoint": ["http://localhost:3002/api"],
        "permissions": ["automated_budget_approval", "payment_processing", "financial_reporting"]
      }
    },
    {
      "username": "supplier_agent",
      "enabled": true,
      "emailVerified": true,
      "email": "supplier-agent@vendor.com",
      "firstName": "Supplier",
      "lastName": "Agent",
      "credentials": [
        {
          "type": "password",
          "value": "agent-password-123",
          "temporary": false
        }
      ],
      "attributes": {
        "role": ["agent"],
        "agent_type": ["supplier"],
        "organization": ["vendor-b"],
        "capabilities": ["proposal_generation", "delivery_tracking", "invoicing"],
        "api_endpoint": ["http://localhost:3003/api"],
        "permissions": ["automated_proposal_generation", "delivery_tracking", "invoice_processing"]
      }
    }
  ],
  "clients": [
    {
      "clientId": "noumena",
      "enabled": true,
      "publicClient": true,
      "directAccessGrantsEnabled": true,
      "redirectUris": ["http://localhost:12000/*", "http://localhost:15000/*"],
      "webOrigins": ["*"],
      "protocol": "openid-connect"
    },
    {
      "clientId": "npl-cli",
      "enabled": true,
      "publicClient": false,
      "secret": "npl-cli-secret",
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": true,
      "protocol": "openid-connect"
    }
  ]
}
EOF

echo 'Importing realm configuration...'
echo "Using token: ${TOKEN:0:20}..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://keycloak:11000/admin/realms \
  -H 'Authorization: Bearer '"$TOKEN" \
  -H 'Content-Type: application/json' \
  -d @/tmp/realm-config.json)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "409" ]; then
  echo '✅ Realm configuration imported successfully (201) or already exists (409)'
  echo 'Testing realm access...'
  sleep 3
  REALM_TEST=$(curl -s http://keycloak:11000/realms/noumena)
  if echo "$REALM_TEST" | grep -q "realm"; then
    echo '✅ Realm "noumena" is now accessible'
  else
    echo '❌ Realm import may have failed'
    echo "Realm test response: $REALM_TEST"
  fi
else
  echo '❌ Failed to import realm configuration'
  echo "HTTP Status: $HTTP_STATUS"
  echo "Response: $RESPONSE_BODY"
fi 