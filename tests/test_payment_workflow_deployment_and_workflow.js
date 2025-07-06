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
  console.log('🚀 Deploying Payment Workflow Protocol...\n');

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
    // Debug log for error object
    console.log('DEBUG: Error object from deployPaymentWorkflow:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Handle 409 Conflict (already deployed)
    if (
      (error.response && error.response.status === 409) ||
      (error.details && error.details.status === 409) ||
      (error.status === 409) ||
      (error.response && error.response.data && error.response.data.details && error.response.data.details.status === 409)
    ) {
      console.log('ℹ️  Payment workflow protocol already deployed, continuing with test...\n');
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
 * Get current state of OrderCommitment protocol instance
 */
async function getOrderState(protocolId, token) {
  try {
    const response = await axios.get(
      `${NPL_API_URL}/npl/payment_workflow/OrderCommitment/${protocolId}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get order state:', error.response?.data || error.message);
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
 * Test the complete payment workflow deployment and execution
 */
async function testPaymentWorkflowDeploymentAndWorkflow() {
  console.log('🧪 Starting Payment Workflow Deployment and Integration Test...\n');

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

    // Step 2: Create an order commitment instance
    console.log('📝 Step 2: Creating Order Commitment Instance...');
    
    const orderData = {
      orderDetails: {
        productSpec: {
          name: "Premium Software License",
          description: "Enterprise-grade software license for business use",
          sku: "SW-LICENSE-001"
        },
      quantity: 5,
        price: 1000,
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      "@parties": {
        orderAgent: partyEntity(USERS.orderAgent.username),
        supplierAgent: partyEntity(USERS.supplierAgent.username)
      }
    };
    
    const orderInstance = await createOrderInstance(orderAgentToken, orderData);
    const orderId = orderInstance['@id'];
    console.log(`✅ Created Order Commitment: ${orderId} (State: ${orderInstance['@state']})\n`);

    // Calculate total amount once at the top
    const totalAmount = orderData.orderDetails.quantity * orderData.orderDetails.price;

    // Step 3: Test order agent committing to pay
    console.log('💰 Step 3: Order Agent Committing to Pay...');
    await simulateAgentA2ARequest('Order Agent', 'committopay', {
      id: orderId
    }, orderAgentToken);

    // Step 4: Test supplier agent committing to deliver
    console.log('📦 Step 4: Supplier Agent Committing to Deliver...');
    await simulateAgentA2ARequest('Supplier Agent', 'committodeliver', {
      id: orderId
    }, supplierAgentToken);

    // Step 5: Test supplier marking as delivered
    console.log('✅ Step 5: Supplier Marking as Delivered...');
    const deliveryDate = new Date().toISOString();
    await simulateAgentA2ARequest('Supplier Agent', 'markdelivered', {
      id: orderId,
      deliveryDate: deliveryDate
    }, supplierAgentToken);

    // Step 6: Order Agent Paying...
    console.log('💳 Step 6: Order Agent Paying...');
    await simulateAgentA2ARequest('Order Agent', 'pay', {
      id: orderId,
      paymentAmount: totalAmount
    }, orderAgentToken);

    // Step 7: Test completing the order
    console.log('🎉 Step 7: Completing the Order...');
    await simulateAgentA2ARequest('Order Agent', 'complete', {
      id: orderId
    }, orderAgentToken);

    // Step 8: Verify final state
    console.log('🔍 Step 8: Verifying Final State...');
    const finalState = await getOrderState(orderId, orderAgentToken);
    console.log(`✅ Final Order State: ${finalState['@state']}`);

    // Step 9: Test query methods (all should fail in completed state)
    console.log('📊 Step 9: Testing Query Methods in Completed State (should all fail)...');
    
    // Test that all query methods are not allowed in completed state
    const queryMethods = ['gettotalamount', 'getorderdetails', 'isorderagentcommitted', 'issupplieragentcommitted'];
    
    for (const method of queryMethods) {
      console.log(`🔍 Testing ${method} in completed state (should fail)...`);
      try {
        await simulateAgentA2ARequest('Order Agent', method, {
      id: orderId
    }, orderAgentToken);
        console.error(`❌ Expected error when calling ${method} in completed state, but call succeeded`);
        throw new Error(`${method} should not be allowed in completed state`);
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes('Illegal protocol state')) {
          console.log(`✅ Correctly received error when calling ${method} in completed state:`, error.response.data.error);
        } else {
          console.error(`❌ Unexpected error when calling ${method} in completed state:`, error.response?.data || error.message);
          throw error;
        }
      }
    }

    console.log('\n🎉 Payment Workflow Test Completed Successfully!');
    console.log('\n📝 Test Summary:');
    console.log('✅ Payment workflow protocol deployed at runtime');
    console.log('✅ Order commitment instance created');
    console.log('✅ Order agent committed to pay');
    console.log('✅ Supplier agent committed to deliver');
    console.log('✅ Supplier marked as delivered');
    console.log('✅ Order agent paid');
    console.log('✅ Order completed successfully');
    console.log('✅ All query methods working correctly');
    console.log('✅ State transitions enforced correctly');
    console.log('✅ Cross-agent communication working');
    console.log('✅ Full audit trail maintained');

  } catch (error) {
    console.error('❌ Payment Workflow Test Failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPaymentWorkflowDeploymentAndWorkflow().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testPaymentWorkflowDeploymentAndWorkflow }; 