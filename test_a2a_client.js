const axios = require('axios');

const A2A_SERVER_URL = 'http://localhost:8000';

async function testA2AServer() {
  console.log('Testing A2A Server...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${A2A_SERVER_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test agent card endpoint
    console.log('2. Testing agent card endpoint...');
    const agentCardResponse = await axios.get(`${A2A_SERVER_URL}/a2a/agent-card`);
    console.log('✅ Agent card retrieved:', {
      name: agentCardResponse.data.name,
      description: agentCardResponse.data.description,
      version: agentCardResponse.data.version,
      skills: agentCardResponse.data.skills.map(s => s.name)
    });
    console.log('');

    // Test A2A request endpoint (without auth for now)
    console.log('3. Testing A2A request endpoint...');
    const a2aRequest = {
      jsonrpc: '2.0',
      id: 'test-request-1',
      method: 'policy_check',
      params: {
        agent_id: 'test-agent',
        action: 'submit_rfp',
        context: {
          amount: 10000,
          vendor: 'test-vendor'
        }
      }
    };

    try {
      const a2aResponse = await axios.post(`${A2A_SERVER_URL}/a2a/request`, a2aRequest, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ A2A request processed:', a2aResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  A2A request requires proper authentication (expected)');
      } else {
        console.log('❌ A2A request failed:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 A2A Server test completed successfully!');
    console.log('\nAvailable endpoints:');
    console.log(`- Health: ${A2A_SERVER_URL}/health`);
    console.log(`- Agent Card: ${A2A_SERVER_URL}/a2a/agent-card`);
    console.log(`- A2A Request: ${A2A_SERVER_URL}/a2a/request`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the A2A server is running:');
      console.log('   docker-compose up a2a-server');
    }
  }
}

// Run the test
testA2AServer(); 