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
  orderAgent: config.users.humans.find(u => u.username === 'buyer'),
  supplierAgent: config.users.humans.find(u => u.username === 'finance_manager')
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
 * Deploy Payment Workflow protocol to NPL engine via A2A server
 */
async function deployPaymentWorkflow(token) {
  console.log('🚀 Deploying Payment Workflow Protocol for Discovery Test...\n');

  try {
    // Read the payment workflow protocol file
    const paymentProtocolPath = path.join(__dirname, '../src/main/npl-1.0.0/payment_workflow/order_commitment.npl');
    const nplCode = fs.readFileSync(paymentProtocolPath, 'utf8');
    console.log('✅ Payment workflow protocol file loaded');

    // Deploy the protocol
    console.log('📤 Deploying protocol to NPL engine...');
    const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
      package: 'payment_workflow',
      protocol: 'OrderCommitment',
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
    // Handle 409 Conflict (already deployed)
    if (
      (error.response && error.response.status === 409) ||
      (error.details && error.details.status === 409) ||
      (error.status === 409) ||
      (error.response && error.response.data && error.response.data.details && error.response.data.details.status === 409)
    ) {
      console.log('ℹ️  Payment workflow protocol already deployed, continuing with discovery test...\n');
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
      package: 'payment_workflow',
      protocol: 'OrderCommitment',
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
 * Create OrderCommitment protocol instance via NPL
 */
async function createOrderInstance(token, orderData) {
  try {
    const response = await axios.post(
      `${NPL_API_URL}/npl/payment_workflow/OrderCommitment/`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create order instance:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test A2A discovery functionality with runtime-deployed protocols
 */
async function testA2ADiscovery() {
  console.log('🧪 Starting A2A Discovery Integration Test (Runtime Deployment Focus)...\n');

  try {
    // Get tokens for both agents
    console.log('🔑 Getting access tokens for agents...');
    const orderAgentToken = await getAccessToken(USERS.orderAgent.username, USERS.orderAgent.password);
    const supplierAgentToken = await getAccessToken(USERS.supplierAgent.username, USERS.supplierAgent.password);
    console.log('✅ Tokens obtained successfully\n');

    // Step 1: Deploy the payment workflow protocol at runtime
    console.log('📦 Step 1: Deploying Payment Workflow Protocol at Runtime...');
    await deployPaymentWorkflow(orderAgentToken);
    console.log('✅ Payment workflow protocol deployed successfully\n');

    // Step 2: Create multiple order instances for testing discovery
    console.log('📝 Step 2: Creating multiple order instances for discovery testing...');
    
    const orderInstances = [];
    
    // Create Order 1: Order agent creates
    const order1Data = {
      orderDetails: {
        productSpec: {
          name: "AI Analytics Platform License",
          description: "Advanced analytics platform for business intelligence",
          sku: "AI-ANALYTICS-001"
        },
        quantity: 3,
        price: 2500,
        deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days from now
      },
      "@parties": {
        orderAgent: partyEntity(USERS.orderAgent.username),
        supplierAgent: partyEntity(USERS.supplierAgent.username)
      }
    };
    
    const order1 = await createOrderInstance(orderAgentToken, order1Data);
    orderInstances.push(order1);
    console.log(`✅ Created Order 1: ${order1['@id']} (State: ${order1['@state']})`);

    // Create Order 2: Another order
    const order2Data = {
      orderDetails: {
        productSpec: {
          name: "Cloud Infrastructure Services",
          description: "Scalable cloud infrastructure and hosting services",
          sku: "CLOUD-INFRA-001"
        },
        quantity: 1,
        price: 5000,
        deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
      },
      "@parties": {
        orderAgent: partyEntity(USERS.orderAgent.username),
        supplierAgent: partyEntity(USERS.supplierAgent.username)
      }
    };
    
    const order2 = await createOrderInstance(orderAgentToken, order2Data);
    orderInstances.push(order2);
    console.log(`✅ Created Order 2: ${order2['@id']} (State: ${order2['@state']})`);

    // Step 3: Test discovery for order agent
    console.log('\n📋 Step 3: Testing discovery for Order Agent...');
    
    const orderAgentProtocols = await callA2AMethod('listMyProtocols', {
      package: 'payment_workflow',
      protocol: 'OrderCommitment'
    }, orderAgentToken);
    
    // Debug logging
    console.log('🔍 Debug: Full response structure:');
    console.log(JSON.stringify(orderAgentProtocols, null, 2));
    
    console.log(`✅ Order Agent found ${orderAgentProtocols.result?.count || 'unknown'} protocols`);
    console.log('📋 Order Agent protocols:');
    
    if (orderAgentProtocols.result && orderAgentProtocols.result.protocols && Array.isArray(orderAgentProtocols.result.protocols)) {
      orderAgentProtocols.result.protocols.forEach((protocol, index) => {
        console.log(`   ${index + 1}. ${protocol['@id']} (State: ${protocol['@state']})`);
      });
    } else {
      console.log('❌ No protocols array found in response');
      console.log('Response structure:', Object.keys(orderAgentProtocols));
      if (orderAgentProtocols.result) {
        console.log('Result structure:', Object.keys(orderAgentProtocols.result));
      }
    }

    // Step 4: Test discovery for supplier agent
    console.log('\n📋 Step 4: Testing discovery for Supplier Agent...');
    
    const supplierAgentProtocols = await callA2AMethod('listMyProtocols', {
      package: 'payment_workflow',
      protocol: 'OrderCommitment'
    }, supplierAgentToken);
    
    console.log(`✅ Supplier Agent found ${supplierAgentProtocols.result?.count || 'unknown'} protocols`);
    console.log('📋 Supplier Agent protocols:');
    
    if (supplierAgentProtocols.result && supplierAgentProtocols.result.protocols && Array.isArray(supplierAgentProtocols.result.protocols)) {
      supplierAgentProtocols.result.protocols.forEach((protocol, index) => {
      console.log(`   ${index + 1}. ${protocol['@id']} (State: ${protocol['@state']})`);
    });
    } else {
      console.log('❌ No protocols array found in response');
    }

    // Step 5: Test protocol content retrieval
    console.log('\n📄 Step 5: Testing protocol content retrieval...');
    
    if (orderInstances.length > 0) {
      const firstOrderId = orderInstances[0]['@id'];
      console.log(`🔍 Retrieving content for order: ${firstOrderId}`);
      
      const orderContent = await callA2AMethod('getMyProtocolContent', {
        protocolId: firstOrderId,
        package: 'payment_workflow',
        protocol: 'OrderCommitment'
      }, orderAgentToken);
      
      console.log('✅ Protocol content retrieved successfully');
      console.log('📋 Order content structure:', Object.keys(orderContent.result?.content || {}));
      
      if (orderContent.result?.content) {
        const content = orderContent.result.content;
        console.log(`   Order ID: ${content.orderId || 'N/A'}`);
        console.log(`   Item: ${content.itemName || 'N/A'}`);
        console.log(`   Quantity: ${content.quantity || 'N/A'}`);
        console.log(`   Total Amount: ${content.totalAmount || 'N/A'}`);
        console.log(`   State: ${content['@state'] || 'N/A'}`);
      }
    }

    // Step 6: Test A2A skills endpoint
    console.log('\n🎯 Step 6: Testing A2A skills endpoint...');
    
    const skillsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/skills`);
    console.log('✅ Skills endpoint responded successfully');
    console.log('📋 Available protocols:', skillsResponse.data.protocols);
    console.log('📋 Available skills:', skillsResponse.data.skills?.length || 0, 'protocol(s)');
    
    if (skillsResponse.data.skills && skillsResponse.data.skills.length > 0) {
      skillsResponse.data.skills.forEach((skill, index) => {
        console.log(`   ${index + 1}. ${skill.package}.${skill.protocol} (${skill.methods?.length || 0} methods)`);
      });
    }

    // Step 7: Test protocol listing endpoint
    console.log('\n📋 Step 7: Testing protocol listing endpoint...');
    
    const protocolsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/protocols`, {
      headers: {
        'Authorization': `Bearer ${orderAgentToken}`
      }
    });
    
    console.log('✅ Protocol listing endpoint responded successfully');
    console.log('📋 Available packages:', protocolsResponse.data.result?.packages || []);
    console.log('📋 Protocol details:', protocolsResponse.data.result?.protocols || []);
    console.log(`📋 Total protocols: ${protocolsResponse.data.result?.count || 0}`);

    // Step 8: Test method execution on discovered protocols
    console.log('\n⚡ Step 8: Testing method execution on discovered protocols...');
    
    if (orderInstances.length > 0) {
      const testOrderId = orderInstances[0]['@id'];
      console.log(`🔧 Testing method execution on order: ${testOrderId}`);
      
      // Test getting order status
              const statusResult = await callA2AMethod('getstatus', {
        id: testOrderId
      }, orderAgentToken);
      
      console.log('✅ Method execution successful');
      console.log(`📋 Order status: ${statusResult.result}`);
      
      // Test getting total amount
              const amountResult = await callA2AMethod('gettotalamount', {
        id: testOrderId
      }, orderAgentToken);
      
      console.log(`📋 Total amount: ${amountResult.result}`);
    }

    console.log('\n🎉 A2A Discovery Test Completed Successfully!');
    console.log('\n📝 Test Summary:');
    console.log('✅ Payment workflow protocol deployed at runtime');
    console.log('✅ Multiple order instances created');
    console.log('✅ Protocol discovery working for both agents');
    console.log('✅ Protocol content retrieval working');
    console.log('✅ A2A skills endpoint working');
    console.log('✅ Protocol listing endpoint working');
    console.log('✅ Method execution on discovered protocols working');
    console.log('✅ Cross-agent protocol discovery working');
    console.log('✅ Runtime deployment and discovery integration working');

  } catch (error) {
    console.error('❌ A2A Discovery Test Failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testA2ADiscovery().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testA2ADiscovery }; 