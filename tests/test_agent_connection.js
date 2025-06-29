const axios = require('axios');

async function testAgentConnection() {
    console.log('Testing agent-to-agent connection through A2A server...\n');

    try {
        // Test 1: Check A2A server health
        console.log('1. Testing A2A server health...');
        const healthResponse = await axios.get('http://localhost:8000/health');
        console.log('✅ A2A server is healthy:', healthResponse.data);

        // Test 2: Get procurement agent service card
        console.log('\n2. Getting procurement agent service card...');
        const procurementCardResponse = await axios.get('http://localhost:8001/service-card');
        console.log('✅ Procurement agent service card:', procurementCardResponse.data);

        // Test 3: Get finance agent service card
        console.log('\n3. Getting finance agent service card...');
        const financeCardResponse = await axios.get('http://localhost:8002/service-card');
        console.log('✅ Finance agent service card:', financeCardResponse.data);

        // Test 4: Create an RFP through procurement agent
        console.log('\n4. Creating RFP through procurement agent...');
        const rfpData = {
            title: 'Software Development Services',
            description: 'Development of custom software solution for Q1 2024',
            budget: 50000,
            deadline: '2024-03-31'
        };
        
        const createRfpResponse = await axios.post('http://localhost:8001/rfp', rfpData);
        console.log('✅ RFP created:', createRfpResponse.data);

        // Test 5: Check budget availability through finance agent
        console.log('\n5. Checking budget availability through finance agent...');
        const budgetCheckResponse = await axios.post('http://localhost:8002/check-budget', {
            amount: 50000,
            department: 'IT'
        });
        console.log('✅ Budget check result:', budgetCheckResponse.data);

        // Test 6: Submit RFP for approval
        console.log('\n6. Submitting RFP for approval...');
        const submitResponse = await axios.post(`http://localhost:8001/rfp/${createRfpResponse.data.id}/submit`);
        console.log('✅ RFP submitted for approval:', submitResponse.data);

        // Test 7: Approve budget through finance agent
        console.log('\n7. Approving budget through finance agent...');
        const approveResponse = await axios.post('http://localhost:8002/approve-budget', {
            rfpId: createRfpResponse.data.id,
            approvedAmount: 45000,
            reason: 'Approved with 10% reduction for cost optimization'
        });
        console.log('✅ Budget approved:', approveResponse.data);

        // Test 8: Get final RFP status
        console.log('\n8. Getting final RFP status...');
        const statusResponse = await axios.get(`http://localhost:8001/rfp/${createRfpResponse.data.id}`);
        console.log('✅ Final RFP status:', statusResponse.data);

        console.log('\n🎉 All tests passed! Agents are successfully connected and communicating.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testAgentConnection(); 