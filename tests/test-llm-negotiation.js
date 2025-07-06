const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BUYER_AGENT_URL = 'http://localhost:8001';
const SELLER_AGENT_URL = 'http://localhost:8002';
const A2A_SERVER_URL = 'http://localhost:8000';

async function testLLMNegotiation() {
  console.log('🤖 Starting LLM-Powered Agent Negotiation Test\n');

  try {
    // Step 1: Start negotiation from buyer agent
    console.log('📞 Step 1: Buyer agent initiating negotiation...');
    const negotiationResponse = await axios.post(`${BUYER_AGENT_URL}/agents/negotiate`, {
      budget: 5000
    });

    console.log('📊 Full negotiation response:', JSON.stringify(negotiationResponse.data, null, 2));

    if (negotiationResponse.data.success) {
      console.log('✅ Negotiation completed successfully!');
      console.log('📊 Negotiation Results:');
      console.log(`   Product: ${negotiationResponse.data.result.product.name}`);
      console.log(`   Final Price: $${negotiationResponse.data.result.finalPrice}`);
      console.log(`   Success: ${negotiationResponse.data.result.success}`);
      
      // Display conversation history
      console.log('\n💬 Conversation History:');
      negotiationResponse.data.result.conversationHistory.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.from.toUpperCase()}]: ${msg.message}`);
      });

      // Step 2: Execute payment workflow if negotiation was successful
      if (negotiationResponse.data.result.success && negotiationResponse.data.result.paymentWorkflowData) {
        console.log('\n💳 Step 2: Executing payment workflow...');
        await executePaymentWorkflow(negotiationResponse.data.result.paymentWorkflowData);
      }
    } else {
      console.log('❌ Negotiation failed');
      console.log('Error:', negotiationResponse.data.error);
      console.log('Result error:', negotiationResponse.data.result?.error);
      console.log('Full result:', JSON.stringify(negotiationResponse.data.result, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function executePaymentWorkflow(paymentData) {
  try {
    console.log('🔧 Setting up payment workflow...');
    console.log('   Payment Data:', JSON.stringify(paymentData, null, 2));

    // Read NPL code for deploy
    const nplPath = path.join(__dirname, '../src/main/npl-1.0.0/payment_workflow/order_commitment.npl');
    const nplCode = fs.readFileSync(nplPath, 'utf8');

    // Step 1: Deploy the payment workflow if not already deployed
    console.log('\n📦 Step 2.1: Deploying payment workflow...');
    const token = await getToken();
    const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
      package: 'payment_workflow',
      protocol: 'OrderCommitment',
      nplCode: nplCode,
      token: token
    });

    if (deployResponse.data.success) {
      console.log('✅ Payment workflow deployed successfully');
      
      // Force refresh the dynamic method manager to generate new methods
      console.log('🔄 Refreshing dynamic method manager...');
      try {
        const refreshResponse = await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, {
          token: token
        });
        if (refreshResponse.data.success) {
          console.log('✅ Dynamic method manager refreshed successfully');
        } else {
          console.log('⚠️ Dynamic method manager refresh failed, continuing...');
        }
      } catch (error) {
        console.log('⚠️ Dynamic method manager refresh failed, continuing...');
      }
      
      // Step 2: Instantiate the payment protocol
      console.log('\n🚀 Step 2.2: Instantiating payment protocol...');
      const instantiateResponse = await axios.post(`${A2A_SERVER_URL}/a2a/instantiate`, {
        package: 'payment_workflow',
        protocol: 'OrderCommitment',
        parties: {
          orderAgent: { jwt: token },
          supplierAgent: { jwt: token }
        },
        initialData: {
          orderDetails: {
            productSpec: {
              name: paymentData.product.name,
              description: paymentData.product.description,
              sku: paymentData.product.id
            },
            quantity: 1,
            price: paymentData.amount,
            deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          }
        },
        orchestratorToken: token
      });

      if (instantiateResponse.data.success) {
        console.log('✅ Payment protocol instantiated');
        console.log('   Protocol ID:', instantiateResponse.data.result.protocolId);
        
        // Step 3: Execute payment steps
        console.log('\n💰 Step 2.3: Executing payment steps...');
        
        // Get the protocol ID from the instantiation response
        const protocolId = instantiateResponse.data.result.protocolId;
        console.log(`   Protocol ID: ${protocolId}`);
        
        // Step 1: Buyer commits to pay
        console.log('   📝 Buyer committing to order...');
        const commitToPayResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
          package: 'payment_workflow',
          protocol: 'OrderCommitment',
          method: 'committopay',
          params: {
            id: protocolId
          },
          token: token
        });
        console.log('   ✅ Buyer committed to pay');
        
        // Step 2: Seller commits to deliver
        console.log('   📦 Seller committing to deliver...');
        const commitToDeliverResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
          package: 'payment_workflow',
          protocol: 'OrderCommitment',
          method: 'committodeliver',
          params: {
            id: protocolId
          },
          token: token
        });
        console.log('   ✅ Seller committed to deliver');
        
        // Step 3: Seller marks as delivered
        console.log('   🚚 Seller marking as delivered...');
        const markDeliveredResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
          package: 'payment_workflow',
          protocol: 'OrderCommitment',
          method: 'markdelivered',
          params: {
            id: protocolId,
            deliveryDate: new Date().toISOString()
          },
          token: token
        });
        console.log('   ✅ Product marked as delivered');
        
        // Step 4: Buyer pays
        console.log('   💳 Buyer making payment...');
        const payResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
          package: 'payment_workflow',
          protocol: 'OrderCommitment',
          method: 'pay',
          params: {
            id: protocolId,
            paymentAmount: paymentData.amount
          },
          token: token
        });
        console.log('   ✅ Payment completed');
        
        // Step 5: Complete the order
        console.log('   ✅ Completing order...');
        const completeResponse = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
          package: 'payment_workflow',
          protocol: 'OrderCommitment',
          method: 'complete',
          params: {
            id: protocolId
          },
          token: token
        });
        console.log('   ✅ Order completed successfully!');
        
        console.log('\n🎉 Payment workflow executed successfully!');
      } else {
        console.log('❌ Failed to instantiate payment protocol');
      }
    } else {
      console.log('❌ Failed to deploy payment workflow');
      console.log('Deploy error:', deployResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Payment workflow execution failed:', error.response?.data || error.message);
  }
}

async function getToken() {
  try {
    const response = await axios.post('http://localhost:11000/realms/noumena/protocol/openid-connect/token', 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'a2a-service',
        client_secret: 'a2a-service-secret'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get token:', error.message);
    return 'mock-token';
  }
}

async function testDirectAgentCommunication() {
  console.log('\n🔗 Testing Direct Agent Communication...\n');

  try {
    // Test 1: Buyer sends message to seller
    console.log('📤 Test 1: Buyer sending message to seller...');
    const buyerMessage = await axios.post(`${SELLER_AGENT_URL}/agents/message`, {
      fromAgentId: 'buyer-agent',
      toAgentId: 'seller-agent',
      content: 'Hello! I\'m looking to purchase a high-quality laptop. What do you have available?',
      type: 'negotiation'
    });

    console.log('📥 Seller response:', buyerMessage.data.result.message);

    // Test 2: Seller responds with product offering
    console.log('\n📤 Test 2: Seller offering products...');
    const sellerResponse = await axios.post(`${BUYER_AGENT_URL}/agents/message`, {
      fromAgentId: 'seller-agent',
      toAgentId: 'buyer-agent',
      content: 'I have a Premium Laptop available for $1200. High-performance laptop with 16GB RAM, 512GB SSD, Intel i7 processor. Features include: 16GB RAM, 512GB SSD, Intel i7, 15.6" Display. Would you like to know more about this product?',
      type: 'negotiation'
    });

    console.log('📥 Buyer response:', sellerResponse.data.result.message);

    // Test 3: Price negotiation
    console.log('\n📤 Test 3: Buyer making counter-offer...');
    const negotiationResponse = await axios.post(`${SELLER_AGENT_URL}/agents/message`, {
      fromAgentId: 'buyer-agent',
      toAgentId: 'seller-agent',
      content: 'I can offer $1000 for the Premium Laptop. This is within my budget.',
      type: 'negotiation'
    });

    console.log('📥 Seller response:', negotiationResponse.data.result.message);

  } catch (error) {
    console.error('❌ Direct communication test failed:', error.response?.data || error.message);
  }
}

// Main test execution
async function main() {
  console.log('🚀 LLM-Powered Agent Negotiation Test Suite\n');
  console.log('This test demonstrates:');
  console.log('1. LLM-powered negotiation between buyer and seller agents');
  console.log('2. Intelligent price discovery and agreement');
  console.log('3. Automatic payment workflow execution');
  console.log('4. Direct agent-to-agent communication\n');

  // Test direct communication first
  await testDirectAgentCommunication();

  // Then test full negotiation flow
  await testLLMNegotiation();

  console.log('\n🎉 Test suite completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testLLMNegotiation,
  testDirectAgentCommunication,
  executePaymentWorkflow
}; 