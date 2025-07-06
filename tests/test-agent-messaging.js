const axios = require('axios');

// Configuration
const A2A_SERVER_URL = 'http://localhost:8000';
const BUYER_AGENT_URL = 'http://localhost:8001';
const SELLER_AGENT_URL = 'http://localhost:8002';

// Test token (you may need to get a real token from your auth system)
const TEST_TOKEN = 'test-token-123';

async function getToken() {
  try {
    // Try to get a real token from Keycloak
    const response = await axios.post('http://localhost:8080/realms/a2a-realm/protocol/openid-connect/token', 
      'grant_type=client_credentials&client_id=a2a-client&client_secret=a2a-secret',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      }
    );
    
    if (response.data && response.data.access_token) {
      console.log('✅ Real token obtained from Keycloak');
      return response.data.access_token;
    } else {
      throw new Error('No access token in response');
    }
  } catch (error) {
    console.log('⚠️  Keycloak token request failed, using test token');
    console.log('   Error:', error.message);
    return TEST_TOKEN;
  }
}

async function testAgentMessaging() {
  console.log('🧪 Testing Agent-to-Agent Messaging System\n');
  
  let token;
  try {
    token = await getToken();
    console.log('✅ Authentication token obtained');
  } catch (error) {
    console.log('⚠️  Using test token for authentication');
    token = TEST_TOKEN;
  }

  // Test 1: Check if agents are registered and discoverable
  console.log('\n📋 Test 1: Agent Discovery');
  try {
    const discoveryResponse = await axios.get(`${A2A_SERVER_URL}/agents/agents`);
    
    const agents = discoveryResponse.data.agents;
    console.log(`✅ Found ${agents.length} registered agents:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.agentId} (${agent.name}) - Status: ${agent.status}`);
    });
    
    if (agents.length < 2) {
      console.log('❌ Expected at least 2 agents (Buyer and Seller)');
      return;
    }
  } catch (error) {
    console.log('❌ Agent discovery failed:', error.response?.data || error.message);
    return;
  }

  // Test 2: Send a message from Buyer to Seller
  console.log('\n📤 Test 2: Direct Message (Buyer → Seller)');
  try {
    const messageResponse = await axios.post(`${A2A_SERVER_URL}/agents/message`, {
      fromAgentId: 'enterprise-buyer-agent-mcrnonfn',
      toAgentId: 'enterprise-seller-agent-mcrnonfb',
      type: 'request',
      content: {
        type: 'order_request',
        message: 'Hello Seller! I need a quote for 100 laptops.',
        orderId: 'order-123',
        items: ['laptop'],
        quantity: 100
      },
      metadata: {
        priority: 'high',
        category: 'procurement'
      }
    });
    
    console.log('✅ Message sent successfully');
    console.log('   Message ID:', messageResponse.data.messageId);
    console.log('   Status:', messageResponse.data.status);
    console.log('   Response:', JSON.stringify(messageResponse.data.response, null, 2));
  } catch (error) {
    console.log('❌ Direct message failed:', error.response?.data || error.message);
  }

  // Test 3: Start a collaboration between agents
  console.log('\n🤝 Test 3: Agent Collaboration');
  try {
    const collaborationResponse = await axios.post(`${A2A_SERVER_URL}/agents/collaborate`, {
      fromAgentId: 'enterprise-buyer-agent-mcrnonfn',
      targetAgentId: 'enterprise-seller-agent-mcrnonfb',
      type: 'procurement_workflow',
      details: {
        workflow: 'purchase_order_approval',
        budget: 50000,
        timeline: '2 weeks'
      },
      metadata: {
        department: 'IT',
        urgency: 'medium'
      }
    });
    
    console.log('✅ Collaboration started successfully');
    console.log('   Collaboration ID:', collaborationResponse.data.collaborationId);
    console.log('   Status:', collaborationResponse.data.status);
    console.log('   Message:', collaborationResponse.data.message);
  } catch (error) {
    console.log('❌ Collaboration failed:', error.response?.data || error.message);
  }

  // Test 4: Send a notification (broadcast)
  console.log('\n📢 Test 4: Broadcast Notification');
  try {
    const notificationResponse = await axios.post(`${A2A_SERVER_URL}/agents/message`, {
      fromAgentId: 'enterprise-buyer-agent-mcrnonfn',
      type: 'notification',
      content: {
        type: 'system_announcement',
        message: 'System maintenance scheduled for tomorrow at 2 AM',
        priority: 'info',
        affectedServices: ['procurement', 'finance']
      },
      metadata: {
        category: 'system',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });
    
    console.log('✅ Broadcast notification sent successfully');
    console.log('   Message ID:', notificationResponse.data.messageId);
    console.log('   Status:', notificationResponse.data.status);
    if (notificationResponse.data.response) {
      console.log('   Recipients:', notificationResponse.data.response.totalRecipients);
      console.log('   Success:', notificationResponse.data.response.successCount);
      console.log('   Failures:', notificationResponse.data.response.failureCount);
    }
  } catch (error) {
    console.log('❌ Broadcast notification failed:', error.response?.data || error.message);
  }

  // Test 5: Get message history
  console.log('\n📜 Test 5: Message History');
  try {
    const historyResponse = await axios.get(`${A2A_SERVER_URL}/agents/messages/enterprise-buyer-agent-mcrnonfn?limit=10`);
    
    console.log('✅ Message history retrieved successfully');
    console.log(`   Found ${historyResponse.data.messages.length} messages`);
    
    if (historyResponse.data.messages.length > 0) {
      const latestMessage = historyResponse.data.messages[0];
      console.log('   Latest message:');
      console.log(`     From: ${latestMessage.fromAgentId}`);
      console.log(`     To: ${latestMessage.toAgentId || 'broadcast'}`);
      console.log(`     Type: ${latestMessage.content.type}`);
      console.log(`     Timestamp: ${latestMessage.timestamp}`);
    }
  } catch (error) {
    console.log('❌ Message history retrieval failed:', error.response?.data || error.message);
  }

  // Test 6: Get communication statistics
  console.log('\n📊 Test 6: Communication Statistics');
  try {
    const statsResponse = await axios.get(`${A2A_SERVER_URL}/agents/stats/communication`);
    
    console.log('✅ Communication statistics retrieved successfully');
    console.log('   Total Messages:', statsResponse.data.totalMessages);
    console.log('   Messages by Type:', JSON.stringify(statsResponse.data.messagesByType, null, 2));
    console.log('   Messages by Status:', JSON.stringify(statsResponse.data.messagesByStatus, null, 2));
    console.log('   Active Conversations:', statsResponse.data.activeConversations);
  } catch (error) {
    console.log('❌ Communication statistics failed:', error.response?.data || error.message);
  }

  // Test 7: Test direct agent communication (bypassing A2A server)
  console.log('\n🔗 Test 7: Direct Agent Communication');
  try {
    const directMessageResponse = await axios.post(`${SELLER_AGENT_URL}/`, {
      jsonrpc: '2.0',
      id: 'test-direct-1',
      method: 'agent.message',
      params: {
        message: {
          id: 'direct-msg-1',
          fromAgentId: 'enterprise-buyer-agent-mcrnonfn',
          toAgentId: 'enterprise-seller-agent-mcrnonfb',
          type: 'request',
          content: {
            type: 'direct_test',
            message: 'This is a direct test message from Buyer to Seller',
            testData: { timestamp: new Date().toISOString() }
          },
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Direct agent communication successful');
    console.log('   Response:', JSON.stringify(directMessageResponse.data.result, null, 2));
  } catch (error) {
    console.log('❌ Direct agent communication failed:', error.response?.data || error.message);
  }

  console.log('\n🎉 Agent Messaging Tests Completed!');
}

// Run the tests
testAgentMessaging().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}); 