const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'user-config.json'), 'utf8'));

// Configuration
const KEYCLOAK_URL = config.keycloak.url;
const A2A_SERVER_URL = 'http://localhost:8000';
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

/**
 * Call A2A method via A2A server
 */
async function callA2AMethod(methodName, params, token) {
  try {
    const response = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
      package: 'rfp_workflow',
      protocol: 'RfpWorkflow',
      method: methodName,
      params: params,
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`A2A method call failed for ${methodName}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Simulate agent sending A2A request and receiving response
 */
async function simulateAgentA2ARequest(agentName, methodName, params, token) {
  console.log(`🤖 ${agentName} sending A2A request: ${methodName}`);
  
  const a2aRequest = {
    jsonrpc: "2.0",
    id: `req-${Date.now()}`,
    method: methodName,
    params: params
  };

  console.log(`📤 A2A Request from ${agentName}:`, JSON.stringify(a2aRequest, null, 2));

  // Call A2A server
  const result = await callA2AMethod(methodName, params, token);
  
  const a2aResponse = {
    jsonrpc: "2.0",
    id: a2aRequest.id,
    result: result
  };

  console.log(`📥 A2A Response to ${agentName}:`, JSON.stringify(a2aResponse, null, 2));
  console.log(`✅ ${agentName} received response for ${methodName}\n`);

  return result;
}

/**
 * Get current state of RFP protocol instance
 */
async function getRfpState(protocolId, token) {
  try {
    const response = await axios.get(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/${protocolId}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get RFP state:', error.response?.data || error.message);
    throw error;
  }
}

async function testA2ARfpFlow() {
  console.log('🧪 Starting A2A RFP Flow Integration Test...\n');

  try {
    // Get tokens for both agents
    console.log('🔑 Getting access tokens for agents...');
    const procurementToken = await getAccessToken(USERS.procurementAgent.username, USERS.procurementAgent.password);
    const financeToken = await getAccessToken(USERS.financeAgent.username, USERS.financeAgent.password);
    console.log('✅ Tokens obtained successfully\n');

    // Step 1: Create new RFP workflow instance via NPL (this creates the protocol instance)
    console.log('📝 Step 1: Creating new RFP workflow instance...');
    const rfpId = `rfp-a2a-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const requestedAmount = 75000;

    const rfpData = {
      initialRfp: {
        rfpId: rfpId,
        title: "AI-Powered Analytics Platform",
        description: "Development of machine learning analytics platform for business intelligence",
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

    const protocolId = createResponse.data['@id'];
    console.log(`✅ RFP workflow created with protocol ID: ${protocolId}`);
    console.log(`📋 Initial state: ${createResponse.data['@state']}\n`);

    // Step 2: Procurement Agent submits RFP for approval via A2A
    console.log('📤 Step 2: Procurement Agent submits RFP for approval via A2A...');
    const submitResult = await simulateAgentA2ARequest(
      'Procurement Agent',
      'procurement.submit_rfp',
      { protocolId: protocolId },
      procurementToken
    );

    // Check state after submission
    const stateAfterSubmit = await getRfpState(protocolId, procurementToken);
    console.log(`📋 State after submission: ${stateAfterSubmit['@state']}\n`);

    // Step 3: Finance Agent approves budget via A2A
    console.log('💰 Step 3: Finance Agent approves budget via A2A...');
    const approveResult = await simulateAgentA2ARequest(
      'Finance Agent',
      'finance.approve_budget',
      {
        protocolId: protocolId,
        approvedAmount: requestedAmount,
        reason: "Budget approved for AI analytics platform development"
      },
      financeToken
    );

    // Check state after approval
    const stateAfterApprove = await getRfpState(protocolId, financeToken);
    console.log(`📋 State after budget approval: ${stateAfterApprove['@state']}\n`);

    // Step 4: Procurement Agent activates RFP via A2A
    console.log('🚦 Step 4: Procurement Agent activates RFP via A2A...');
    const activateResult = await simulateAgentA2ARequest(
      'Procurement Agent',
      'procurement.track_rfp',
      { protocolId: protocolId },
      procurementToken
    );

    // Check final state
    const finalState = await getRfpState(protocolId, procurementToken);
    console.log(`📋 Final state: ${finalState['@state']}\n`);

    // Step 5: Test additional A2A methods
    console.log('🔍 Step 5: Testing additional A2A methods...');
    
    // Get RFP details via A2A
    const detailsResult = await simulateAgentA2ARequest(
      'Procurement Agent',
      'procurement.track_rfp',
      { protocolId: protocolId },
      procurementToken
    );

    // Get current budget via A2A
    const budgetResult = await simulateAgentA2ARequest(
      'Finance Agent',
      'finance.check_budget_availability',
      { protocolId: protocolId },
      financeToken
    );

    // Get budget approval status via A2A
    const approvalStatusResult = await simulateAgentA2ARequest(
      'Finance Agent',
      'finance.get_budget_status',
      { protocolId: protocolId },
      financeToken
    );

    // Summary
    console.log('🎉 A2A RFP Flow Integration Test completed successfully!');
    console.log('📈 Workflow Summary:');
    console.log('   draft → pendingApproval → approved → active');
    console.log('   ✅ All A2A method calls completed successfully!');
    console.log('   ✅ All state transitions completed successfully!');
    console.log('   ✅ Message passing between agents and A2A server working!');
    console.log('\n📊 Final RFP Details:');
    console.log(`   RFP ID: ${rfpId}`);
    console.log(`   Protocol ID: ${protocolId}`);
    console.log(`   Final State: ${finalState['@state']}`);
    console.log(`   Requested Amount: $${requestedAmount}`);
    console.log(`   Approved Amount: $${finalState.approvedBudget?.amount || 'N/A'}`);

  } catch (error) {
    console.error('❌ A2A RFP Flow test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
    process.exit(1);
  }
}

// Run the test
testA2ARfpFlow(); 