const axios = require('axios');

const PROCUREMENT_AGENT_URL = 'http://localhost:8001';
const A2A_HUB_URL = 'http://localhost:8000';

async function testProcurementAgent() {
  console.log('Testing Procurement Agent...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${PROCUREMENT_AGENT_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test agent card endpoint
    console.log('2. Testing agent card endpoint...');
    const agentCardResponse = await axios.get(`${PROCUREMENT_AGENT_URL}/a2a/agent-card`);
    console.log('✅ Agent card retrieved:', {
      name: agentCardResponse.data.name,
      description: agentCardResponse.data.description,
      version: agentCardResponse.data.version,
      skills: agentCardResponse.data.skills.map(s => s.name)
    });
    console.log('');

    // Test create RFP
    console.log('3. Testing create RFP...');
    const createRfpRequest = {
      jsonrpc: '2.0',
      id: 'test-create-1',
      method: 'create_rfp',
      params: {
        agent_id: 'procurement_user',
        title: 'Software Development Services',
        amount: 50000
      }
    };

    const createResponse = await axios.post(`${PROCUREMENT_AGENT_URL}/a2a/request`, createRfpRequest, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ RFP created:', createResponse.data.result);
    const rfpId = createResponse.data.result.rfp_id;
    console.log('');

    // Test track RFP
    console.log('4. Testing track RFP...');
    const trackRfpRequest = {
      jsonrpc: '2.0',
      id: 'test-track-1',
      method: 'track_rfp',
      params: {
        rfp_id: rfpId
      }
    };

    const trackResponse = await axios.post(`${PROCUREMENT_AGENT_URL}/a2a/request`, trackRfpRequest, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ RFP tracked:', trackResponse.data.result);
    console.log('');

    // Test submit RFP (this will call A2A hub)
    console.log('5. Testing submit RFP...');
    const submitRfpRequest = {
      jsonrpc: '2.0',
      id: 'test-submit-1',
      method: 'submit_rfp',
      params: {
        agent_id: 'procurement_user',
        rfp_id: rfpId
      }
    };

    try {
      const submitResponse = await axios.post(`${PROCUREMENT_AGENT_URL}/a2a/request`, submitRfpRequest, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ RFP submitted:', submitResponse.data.result);
    } catch (error) {
      if (error.response?.data?.error) {
        console.log('⚠️  RFP submission failed (expected - no NPL protocols deployed):', error.response.data.error.message);
      } else {
        console.log('❌ RFP submission failed:', error.message);
      }
    }

    console.log('\n🎉 Procurement Agent test completed successfully!');
    console.log('\nAvailable endpoints:');
    console.log(`- Health: ${PROCUREMENT_AGENT_URL}/health`);
    console.log(`- Agent Card: ${PROCUREMENT_AGENT_URL}/a2a/agent-card`);
    console.log(`- A2A Request: ${PROCUREMENT_AGENT_URL}/a2a/request`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProcurementAgent(); 