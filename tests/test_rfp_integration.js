const axios = require('axios');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('user-config.json', 'utf8'));

// Configuration
const KEYCLOAK_URL = config.keycloak.url;
const NPL_API_URL = 'http://localhost:12000';
const REALM = config.realm;
const CLIENT_ID = 'noumena';

// Get users from config
const USERS = {
  procurementAgent: config.users.humans.find(u => u.username === 'buyer'),
  financeAgent: config.users.humans.find(u => u.username === 'finance_manager')
};

async function getAccessToken(username, password) {
  try {
    const response = await axios.post(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: username,
        password: password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error(`Failed to get token for ${username}:`, error.response?.data || error.message);
    throw error;
  }
}

function partyEntity(username) {
  return {
    entity: {
      preferred_username: [username]
    },
    access: {}
  };
}

async function testRfpProtocol() {
  console.log('🧪 Starting RFP Protocol Integration Tests...\n');

  try {
    // Get tokens for both users
    console.log('🔑 Getting access tokens...');
    const procurementToken = await getAccessToken(USERS.procurementAgent.username, USERS.procurementAgent.password);
    const financeToken = await getAccessToken(USERS.financeAgent.username, USERS.financeAgent.password);
    console.log('✅ Tokens obtained successfully\n');

    // Test 1: Create RFP Request as procurement agent
    console.log('📝 Test 1: Creating RFP Request as procurement agent...');
    // Generate a unique rfpId and current timestamp
    const rfpId = `rfp-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const requestedAmount = 50000;

    const rfpData = {
      initialRfp: {
        rfpId: rfpId,
        title: "Software Development Services",
        description: "Need custom software development for internal tools",
        requestedAmount: requestedAmount,
        requesterId: USERS.procurementAgent.username,
        createdAt: createdAt
      },
      "@parties": {
        procurementAgent: partyEntity(USERS.procurementAgent.username),
        financeAgent: partyEntity(USERS.financeAgent.username)
      }
    };

    const createResponse = await axios.post(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/`,
      rfpData,
      {
        headers: {
          'Authorization': `Bearer ${procurementToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ RFP Request created:', createResponse.data);
    console.log(`📋 RFP ID: ${rfpId}`);
    console.log(`📋 Protocol ID: ${createResponse.data['@id']}\n`);

    // Test 2: Get RFP Request as procurement agent using protocol ID
    console.log('👀 Test 2: Retrieving RFP Request as procurement agent...');
    const protocolId = createResponse.data['@id'];
    const getResponse = await axios.get(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/${protocolId}/`,
      {
        headers: {
          'Authorization': `Bearer ${procurementToken}`
        }
      }
    );

    console.log('✅ RFP Request retrieved:', getResponse.data);
    console.log(`📋 Status: ${getResponse.data['@state']}\n`);

    // Test 3: Submit for approval as procurement agent
    console.log('📤 Test 3: Submitting RFP for approval as procurement agent...');
    const submitResponse = await axios.post(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/${protocolId}/submitForApproval`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${procurementToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ RFP Submitted for approval:', submitResponse.data);
    console.log(`📋 Status: ${submitResponse.data['@state']}\n`);

    // Test 4: Approve Budget as finance agent
    console.log('💰 Test 4: Approving budget as finance agent...');
    const approveBudgetResponse = await axios.post(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/${protocolId}/approveBudget`,
      {
        approvedAmount: requestedAmount,
        reason: "Budget approved for software development services"
      },
      {
        headers: {
          'Authorization': `Bearer ${financeToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Budget Approved:', approveBudgetResponse.data);
    console.log(`📋 Status: ${approveBudgetResponse.data['@state']}\n`);

    // Test 5: Activate RFP as procurement agent
    console.log('🚦 Test 5: Activating RFP as procurement agent...');
    const activateResponse = await axios.post(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/${protocolId}/activateRfp`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${procurementToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ RFP Activated:', activateResponse.data);
    console.log(`📋 Status: ${activateResponse.data['@state']}\n`);

    // Test 6: Get final state
    console.log('📊 Test 6: Checking final state...');
    const finalResponse = await axios.get(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/${protocolId}/`,
      {
        headers: {
          'Authorization': `Bearer ${procurementToken}`
        }
      }
    );

    console.log('✅ Final state retrieved:', finalResponse.data);
    console.log(`📋 Final Status: ${finalResponse.data['@state']}\n`);

    console.log('🎉 All integration tests passed successfully!');
    console.log('📈 Workflow Summary:');
    console.log('   draft → pendingApproval → approved → active');
    console.log('   ✅ All state transitions completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
    process.exit(1);
  }
}

// Run the tests
testRfpProtocol(); 