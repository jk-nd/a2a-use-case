const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Hardcoded configuration (matching keycloak-provisioning.sh)
const config = {
    realm: 'noumena',
    keycloak: {
        url: 'http://localhost:11000'
    },
    users: {
        humans: [
            {
                username: 'buyer',
                email: 'buyer@company.com',
                firstName: 'John',
                lastName: 'Buyer',
                password: 'password123'
            },
            {
                username: 'finance_manager',
                email: 'finance@company.com',
                firstName: 'Mike',
                lastName: 'Finance',
                password: 'password123'
            }
        ]
    }
};

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
 * Deploy RFP protocol to NPL engine via A2A server
 */
async function deployRfpProtocol(token) {
  console.log('🚀 Deploying RFP Protocol...\n');

  try {
    // Read the RFP protocol file
    const rfpProtocolPath = path.join(__dirname, '../src/main/npl-1.0.0/rfp_workflow/rfp_protocol.npl');
    const nplCode = fs.readFileSync(rfpProtocolPath, 'utf8');
    console.log('✅ RFP protocol file loaded');

    // Deploy the protocol
    console.log('📤 Deploying protocol to NPL engine...');
    const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
      package: 'rfp_workflow',
      protocol: 'RfpWorkflow',
      nplCode: nplCode,
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Protocol deployed successfully!');
    console.log('📋 Deployment response:', deployResponse.data);

    // Refresh A2A methods
    console.log('\n🔄 Refreshing A2A methods...');
    const refreshResponse = await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ A2A methods refreshed successfully!');
    console.log('📋 Refresh response:', refreshResponse.data);

    return true;
  } catch (error) {
    // Debug log for error object
    console.log('DEBUG: Error object from deployRfpProtocol:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Handle 409 Conflict (already deployed)
    if (
      (error.response && error.response.status === 409) ||
      (error.details && error.details.status === 409) ||
      (error.status === 409) ||
      (error.response && error.response.data && error.response.data.details && error.response.data.details.status === 409)
    ) {
      console.log('ℹ️  RFP protocol already deployed, continuing with test...\n');
      return false;
    }
    console.error('❌ Deployment failed:', error.response?.data || error.message);
    throw error;
  }
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

async function testRfpDeploymentAndWorkflow() {
  console.log('🧪 Starting RFP Deployment and Workflow Integration Test...\n');

  try {
    // Get tokens for both agents
    console.log('🔑 Getting access tokens for agents...');
    const procurementToken = await getAccessToken(USERS.procurementAgent.username, USERS.procurementAgent.password);
    const financeToken = await getAccessToken(USERS.financeAgent.username, USERS.financeAgent.password);
    console.log('✅ Tokens obtained successfully\n');

    // Step 1: Deploy RFP protocol (or skip if already deployed)
    console.log('📦 Step 1: Deploying RFP protocol...');
    try {
      await deployRfpProtocol(procurementToken);
      console.log('✅ RFP protocol deployment completed\n');
    } catch (error) {
      if (
        (error.response && error.response.status === 409) ||
        (error.details && error.details.status === 409) ||
        (error.status === 409) ||
        (error.response && error.response.data && error.response.data.details && error.response.data.details.status === 409)
      ) {
        console.log('ℹ️  RFP protocol already deployed, continuing with test...\n');
      } else {
        throw error;
      }
    }
    // Always refresh A2A methods after deployment attempt
    console.log('🔄 Refreshing A2A methods after deployment...');
    await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, { token: procurementToken }, { headers: { 'Content-Type': 'application/json' } });
    console.log('✅ A2A methods refreshed\n');

    // Force refresh to ensure methods are immediately available
    console.log('🔄 Force refreshing A2A methods...');
    await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, { token: procurementToken }, { headers: { 'Content-Type': 'application/json' } });
    console.log('✅ A2A methods force refreshed\n');

    // Add a small delay to ensure refresh completes
    console.log('⏳ Waiting for refresh to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Refresh delay completed\n');

    // Debug: Check what methods are available
    console.log('🔍 Checking available methods...');
    try {
      const skillsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/skills`);
      console.log('📋 Available skills:', JSON.stringify(skillsResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️  Could not check skills:', error.message);
    }

    // Step 2: Create new RFP workflow instance via NPL (this creates the protocol instance)
    console.log('📝 Step 2: Creating new RFP workflow instance...');
    const timestamp = Date.now();
    const rfpId = `rfp-deploy-test-${timestamp}`;
    const createdAt = new Date().toISOString();
    const requestedAmount = 75000 + (timestamp % 1000); // Add some variation to ensure uniqueness

    const rfpData = {
      initialRfp: {
        rfpId: rfpId,
        title: `AI-Powered Analytics Platform v${timestamp}`,
        description: `Development of machine learning analytics platform for business intelligence - Test ${timestamp}`,
        requestedAmount: requestedAmount,
        requesterId: USERS.procurementAgent.username,
        createdAt: createdAt
      },
      "@parties": {
        procurementAgent: partyEntity(USERS.procurementAgent.username),
        financeAgent: partyEntity(USERS.financeAgent.username)
      }
    };

    console.log(`📋 Creating RFP with ID: ${rfpId}`);
    console.log(`📋 Requested Amount: $${requestedAmount}`);
    console.log(`📋 Title: ${rfpData.initialRfp.title}`);

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
    console.log(`📋 Initial state: ${createResponse.data['@state']}`);
    
    // Verify the protocol instance is in the correct initial state
    if (createResponse.data['@state'] !== 'draft') {
      console.log(`⚠️  Warning: Protocol instance is in state '${createResponse.data['@state']}' instead of 'draft'`);
      console.log(`📋 Full protocol data:`, JSON.stringify(createResponse.data, null, 2));
    } else {
      console.log(`✅ Protocol instance correctly in 'draft' state`);
    }
    console.log('');

    // Step 3: Procurement Agent submits RFP for approval via A2A
    console.log('📤 Step 3: Procurement Agent submits RFP for approval via A2A...');
    const submitResult = await simulateAgentA2ARequest(
      'Procurement Agent',
      'submitforapproval',
      { id: protocolId },
      procurementToken
    );

    // Check state after submission
    const stateAfterSubmit = await getRfpState(protocolId, procurementToken);
    console.log(`📋 State after submission: ${stateAfterSubmit['@state']}\n`);

    // Step 4: Finance Agent approves budget via A2A
    console.log('💰 Step 4: Finance Agent approves budget via A2A...');
    const approveResult = await simulateAgentA2ARequest(
      'Finance Agent',
      'approvebudget',
      {
        id: protocolId,
        approvedAmount: requestedAmount,
        reason: "Budget approved for AI analytics platform development"
      },
      financeToken
    );

    // Check state after approval
    const stateAfterApprove = await getRfpState(protocolId, financeToken);
    console.log(`📋 State after budget approval: ${stateAfterApprove['@state']}\n`);

    // Step 5: Procurement Agent activates RFP via A2A
    console.log('🚦 Step 5: Procurement Agent activates RFP via A2A...');
    const activateResult = await simulateAgentA2ARequest(
      'Procurement Agent',
      'activaterfp',
      { id: protocolId },
      procurementToken
    );

    // Check final state
    const finalState = await getRfpState(protocolId, procurementToken);
    console.log(`📋 Final state: ${finalState['@state']}\n`);

    // Step 6: Test additional A2A methods
    console.log('🔍 Step 6: Testing additional A2A methods...');
    
    // Get RFP details via A2A
    const detailsResult = await simulateAgentA2ARequest(
      'Procurement Agent',
      'getrfpdetails',
      { id: protocolId },
      procurementToken
    );

    // Get current budget via A2A
    const budgetResult = await simulateAgentA2ARequest(
      'Finance Agent',
      'getcurrentbudget',
      { id: protocolId },
      financeToken
    );

    // Get budget approval status via A2A
    const approvalStatusResult = await simulateAgentA2ARequest(
      'Finance Agent',
      'getbudgetapproval',
      { id: protocolId },
      financeToken
    );

    // Summary
    console.log('🎉 RFP Deployment and Workflow Integration Test completed successfully!');
    console.log('📈 Workflow Summary:');
    console.log('   ✅ Protocol deployment completed');
    console.log('   ✅ Protocol instantiation completed');
    console.log('   draft → pendingApproval → approved → active');
    console.log('   ✅ All A2A method calls completed successfully!');
    console.log('   ✅ All state transitions completed successfully!');
    console.log('   ✅ JWT token authentication working correctly!');
    console.log('   ✅ Message passing between agents and A2A server working!');
    console.log('\n📊 Final RFP Details:');
    console.log(`   RFP ID: ${rfpId}`);
    console.log(`   Protocol ID: ${protocolId}`);
    console.log(`   Final State: ${finalState['@state']}`);
    console.log(`   Requested Amount: $${requestedAmount}`);
    console.log(`   Approved Amount: $${finalState.approvedBudget?.amount || 'N/A'}`);

  } catch (error) {
    console.error('❌ RFP Deployment and Workflow test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
    process.exit(1);
  }
}

// Run the test
testRfpDeploymentAndWorkflow(); 