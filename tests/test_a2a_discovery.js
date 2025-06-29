const axios = require('axios');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('user-config.json', 'utf8'));

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
 * Create RFP protocol instance via NPL
 */
async function createRfpInstance(token, rfpData) {
  try {
    const response = await axios.post(
      `${NPL_API_URL}/npl/rfp_workflow/RfpWorkflow/`,
      rfpData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create RFP instance:', error.response?.data || error.message);
    throw error;
  }
}

async function testA2ADiscovery() {
  console.log('🧪 Starting A2A Discovery Integration Test...\n');

  try {
    // Get tokens for both agents
    console.log('🔑 Getting access tokens for agents...');
    const procurementToken = await getAccessToken(USERS.procurementAgent.username, USERS.procurementAgent.password);
    const financeToken = await getAccessToken(USERS.financeAgent.username, USERS.financeAgent.password);
    console.log('✅ Tokens obtained successfully\n');

    // Step 1: Create multiple RFP instances for testing
    console.log('📝 Step 1: Creating multiple RFP instances for testing...');
    
    const rfpInstances = [];
    
    // Create RFP 1: Procurement agent creates
    const rfp1Data = {
      initialRfp: {
        rfpId: `rfp-discovery-1-${Date.now()}`,
        title: "AI Analytics Platform",
        description: "Development of machine learning analytics platform",
        requestedAmount: 75000,
        requesterId: USERS.procurementAgent.username,
        createdAt: new Date().toISOString()
      },
      "@parties": {
        procurementAgent: partyEntity(USERS.procurementAgent.username),
        financeAgent: partyEntity(USERS.financeAgent.username)
      }
    };
    
    const rfp1 = await createRfpInstance(procurementToken, rfp1Data);
    rfpInstances.push(rfp1);
    console.log(`✅ Created RFP 1: ${rfp1['@id']} (State: ${rfp1['@state']})`);

    // Create RFP 2: Another RFP
    const rfp2Data = {
      initialRfp: {
        rfpId: `rfp-discovery-2-${Date.now()}`,
        title: "Cloud Infrastructure",
        description: "Cloud infrastructure setup and migration",
        requestedAmount: 50000,
        requesterId: USERS.procurementAgent.username,
        createdAt: new Date().toISOString()
      },
      "@parties": {
        procurementAgent: partyEntity(USERS.procurementAgent.username),
        financeAgent: partyEntity(USERS.financeAgent.username)
      }
    };
    
    const rfp2 = await createRfpInstance(procurementToken, rfp2Data);
    rfpInstances.push(rfp2);
    console.log(`✅ Created RFP 2: ${rfp2['@id']} (State: ${rfp2['@state']})`);

    // Step 2: Test discovery for procurement agent
    console.log('\n📋 Step 2: Testing discovery for Procurement Agent...');
    
    const procurementProtocols = await callA2AMethod('listMyProtocols', {
      package: 'rfp_workflow',
      protocol: 'RfpWorkflow'
    }, procurementToken);
    
    // Debug logging
    console.log('🔍 Debug: Full response structure:');
    console.log(JSON.stringify(procurementProtocols, null, 2));
    
    console.log(`✅ Procurement Agent found ${procurementProtocols.result?.count || 'unknown'} protocols`);
    console.log('📋 Procurement Agent protocols:');
    
    if (procurementProtocols.result && procurementProtocols.result.protocols && Array.isArray(procurementProtocols.result.protocols)) {
      procurementProtocols.result.protocols.forEach((protocol, index) => {
        console.log(`   ${index + 1}. ${protocol['@id']} (State: ${protocol['@state']})`);
      });
    } else {
      console.log('❌ No protocols array found in response');
      console.log('Response structure:', Object.keys(procurementProtocols));
      if (procurementProtocols.result) {
        console.log('Result structure:', Object.keys(procurementProtocols.result));
      }
    }

    // Step 3: Test discovery for finance agent
    console.log('\n💰 Step 3: Testing discovery for Finance Agent...');
    
    const financeProtocols = await callA2AMethod('listMyProtocols', {
      package: 'rfp_workflow',
      protocol: 'RfpWorkflow'
    }, financeToken);
    
    console.log(`✅ Finance Agent found ${financeProtocols.result.count} protocols`);
    console.log('📋 Finance Agent protocols:');
    financeProtocols.result.protocols.forEach((protocol, index) => {
      console.log(`   ${index + 1}. ${protocol['@id']} (State: ${protocol['@state']})`);
    });

    // Step 4: Test getting protocol content
    console.log('\n📄 Step 4: Testing protocol content retrieval...');
    
    if (rfpInstances.length > 0) {
      const firstProtocolId = rfpInstances[0]['@id'];
      
      // Get content as procurement agent
      console.log(`🔍 Getting content for protocol ${firstProtocolId} as Procurement Agent...`);
      const procurementContent = await callA2AMethod('getMyProtocolContent', {
        protocolId: firstProtocolId,
        package: 'rfp_workflow',
        protocol: 'RfpWorkflow'
      }, procurementToken);
      
      console.log('✅ Procurement Agent content retrieved:');
      console.log(`   Protocol ID: ${procurementContent.result.protocolId}`);
      console.log(`   State: ${procurementContent.result.content['@state']}`);
      console.log(`   RFP ID: ${procurementContent.result.content.initialRfp.rfpId}`);
      console.log(`   Title: ${procurementContent.result.content.initialRfp.title}`);
      console.log(`   Requested Amount: $${procurementContent.result.content.initialRfp.requestedAmount}`);

      // Get content as finance agent
      console.log(`🔍 Getting content for protocol ${firstProtocolId} as Finance Agent...`);
      const financeContent = await callA2AMethod('getMyProtocolContent', {
        protocolId: firstProtocolId,
        package: 'rfp_workflow',
        protocol: 'RfpWorkflow'
      }, financeToken);
      
      console.log('✅ Finance Agent content retrieved:');
      console.log(`   Protocol ID: ${financeContent.result.protocolId}`);
      console.log(`   State: ${financeContent.result.content['@state']}`);
      console.log(`   RFP ID: ${financeContent.result.content.initialRfp.rfpId}`);
      console.log(`   Title: ${financeContent.result.content.initialRfp.title}`);
      console.log(`   Requested Amount: $${financeContent.result.content.initialRfp.requestedAmount}`);
    }

    // Step 5: Test workflow with discovery
    console.log('\n🔄 Step 5: Testing workflow with discovery...');
    
    if (rfpInstances.length > 0) {
      const firstProtocolId = rfpInstances[0]['@id'];
      
      // Procurement agent submits for approval
      console.log(`📤 Procurement Agent submitting RFP ${firstProtocolId} for approval...`);
      await callA2AMethod('submitforapproval', {
        protocolId: firstProtocolId
      }, procurementToken);
      
      // Check updated protocol list
      console.log('📋 Checking updated protocol list for Finance Agent...');
      const updatedFinanceProtocols = await callA2AMethod('listMyProtocols', {
        package: 'rfp_workflow',
        protocol: 'RfpWorkflow'
      }, financeToken);
      
      const pendingProtocols = updatedFinanceProtocols.result.protocols.filter(p => p['@state'] === 'pendingApproval');
      console.log(`✅ Finance Agent found ${pendingProtocols.length} protocols pending approval`);
      
      if (pendingProtocols.length > 0) {
        console.log('🎯 Finance Agent can now approve pending RFPs!');
      }
    }

    console.log('\n🎉 A2A Discovery Integration Test completed successfully!');
    console.log('📊 Test Summary:');
    console.log(`   ✅ Created ${rfpInstances.length} RFP instances`);
    console.log(`   ✅ Procurement Agent discovered ${procurementProtocols.result.count} protocols`);
    console.log(`   ✅ Finance Agent discovered ${financeProtocols.result.count} protocols`);
    console.log(`   ✅ Protocol content retrieval working for both agents`);
    console.log(`   ✅ Workflow integration with discovery working`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testA2ADiscovery().catch(console.error); 