const axios = require('axios');

const FINANCE_AGENT_URL = 'http://localhost:8002';
const PROCUREMENT_AGENT_URL = 'http://localhost:8001';

async function testFinanceAgent() {
  console.log('Testing Finance Agent...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${FINANCE_AGENT_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test agent card endpoint
    console.log('2. Testing agent card endpoint...');
    const agentCardResponse = await axios.get(`${FINANCE_AGENT_URL}/a2a/agent-card`);
    console.log('✅ Agent card retrieved:', {
      name: agentCardResponse.data.name,
      description: agentCardResponse.data.description,
      version: agentCardResponse.data.version,
      skills: agentCardResponse.data.skills.map(s => s.name)
    });
    console.log('');

    // Test check budget availability
    console.log('3. Testing check budget availability...');
    const checkBudgetRequest = {
      jsonrpc: '2.0',
      id: 'test-budget-1',
      method: 'check_budget_availability',
      params: {
        budget_code: 'IT-2024-001',
        amount: 50000
      }
    };

    const checkBudgetResponse = await axios.post(`${FINANCE_AGENT_URL}/a2a/request`, checkBudgetRequest, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Budget availability checked:', checkBudgetResponse.data.result);
    console.log('');

    // Test get budget status
    console.log('4. Testing get budget status...');
    const budgetStatusRequest = {
      jsonrpc: '2.0',
      id: 'test-status-1',
      method: 'get_budget_status',
      params: {
        budget_code: 'IT-2024-001'
      }
    };

    const budgetStatusResponse = await axios.post(`${FINANCE_AGENT_URL}/a2a/request`, budgetStatusRequest, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Budget status retrieved:', budgetStatusResponse.data.result);
    console.log('');

    // Test approve budget (this will call A2A hub)
    console.log('5. Testing approve budget...');
    const approveBudgetRequest = {
      jsonrpc: '2.0',
      id: 'test-approve-1',
      method: 'approve_budget',
      params: {
        agent_id: 'finance_user',
        rfp_id: 'RFP-TEST-001',
        amount: 50000,
        budget_code: 'IT-2024-001',
        comments: 'Approved for software development'
      }
    };

    try {
      const approveBudgetResponse = await axios.post(`${FINANCE_AGENT_URL}/a2a/request`, approveBudgetRequest, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Budget approved:', approveBudgetResponse.data.result);
    } catch (error) {
      if (error.response?.data?.error) {
        console.log('⚠️  Budget approval failed (expected - no NPL protocols deployed):', error.response.data.error.message);
      } else {
        console.log('❌ Budget approval failed:', error.message);
      }
    }

    console.log('\n🎉 Finance Agent test completed successfully!');
    console.log('\nAvailable endpoints:');
    console.log(`- Health: ${FINANCE_AGENT_URL}/health`);
    console.log(`- Agent Card: ${FINANCE_AGENT_URL}/a2a/agent-card`);
    console.log(`- A2A Request: ${FINANCE_AGENT_URL}/a2a/request`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFinanceAgent(); 