const axios = require('axios');

/**
 * Test script for the OrderCommitment NPL protocol
 * This script tests the protocol through the A2A server
 */

const A2A_SERVER_URL = 'http://localhost:8000';
const NPL_ENGINE_URL = 'http://localhost:12000';

// Test data
const testProductSpec = {
    name: "Test Laptop",
    description: "High-performance laptop for testing",
    sku: "LAPTOP-001"
};

const testOrderDetails = {
    productSpec: testProductSpec,
    quantity: 2,
    price: 1500.0,
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

/**
 * Get access token for a user
 */
async function getAccessToken(username, password) {
    try {
        const response = await axios.post('http://localhost:11000/realms/noumena/protocol/openid-connect/token', 
            new URLSearchParams({
                grant_type: 'password',
                client_id: 'noumena',
                username: username,
                password: password
            }), {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to get access token:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Create a test protocol instance via A2A server
 */
async function createProtocolInstance() {
    try {
        // Get token for buyer
        const token = await getAccessToken('buyer', 'password123');
        
        const requestBody = {
            package: 'payment_workflow',
            protocol: 'OrderCommitment',
            parties: {
                orderAgent: {
                    jwt: token
                },
                supplierAgent: {
                    jwt: await getAccessToken('finance_manager', 'password123')
                }
            },
            initialData: {
                orderDetails: testOrderDetails
            },
            orchestratorToken: token
        };

        console.log('Creating OrderCommitment protocol instance...');
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(`${A2A_SERVER_URL}/a2a/instantiate`, requestBody);
        
        console.log('Protocol instance created successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('Error creating protocol instance:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Call A2A method
 */
async function callA2AMethod(methodName, params, token) {
    try {
        const response = await axios.post(`${A2A_SERVER_URL}/a2a/method`, {
            package: 'payment_workflow',
            protocol: 'OrderCommitment',
            method: methodName,
            params: params,
            token: token
        });
        return response.data;
    } catch (error) {
        console.error(`A2A method call failed for ${methodName}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Test the complete workflow
 */
async function testCompleteWorkflow() {
    try {
        console.log('\n=== Testing Complete OrderCommitment Workflow ===\n');
        
        // Step 1: Create protocol instance
        const protocolInstance = await createProtocolInstance();
        const protocolId = protocolInstance.result.protocolId;
        
        console.log(`Protocol ID: ${protocolId}`);
        
        // Get tokens for both parties
        const orderAgentToken = await getAccessToken('buyer', 'password123');
        const supplierAgentToken = await getAccessToken('finance_manager', 'password123');
        
        // Step 2: Check initial state
        console.log('\n--- Step 2: Checking initial state ---');
        const statusResponse = await callA2AMethod('getstatus', { id: protocolId }, orderAgentToken);
        console.log('Initial status:', statusResponse.result);
        
        // Step 3: Order agent commits to pay
        console.log('\n--- Step 3: Order agent commits to pay ---');
        await callA2AMethod('committopay', { id: protocolId }, orderAgentToken);
        console.log('Order agent committed to pay');
        
        // Step 4: Supplier agent commits to deliver
        console.log('\n--- Step 4: Supplier agent commits to deliver ---');
        await callA2AMethod('committodeliver', { id: protocolId }, supplierAgentToken);
        console.log('Supplier agent committed to deliver');
        
        // Step 5: Check committed state
        console.log('\n--- Step 5: Checking committed state ---');
        const committedStatus = await callA2AMethod('getstatus', { id: protocolId }, orderAgentToken);
        console.log('Status after both parties committed:', committedStatus.result);
        
        // Step 6: Supplier marks as delivered
        console.log('\n--- Step 6: Supplier marks as delivered ---');
        const deliveryDate = new Date().toISOString();
        await callA2AMethod('markdelivered', { id: protocolId, deliveryDate: deliveryDate }, supplierAgentToken);
        console.log('Product marked as delivered');
        
        // Step 7: Order agent pays
        console.log('\n--- Step 7: Order agent pays ---');
        const totalAmount = testOrderDetails.quantity * testOrderDetails.price;
        await callA2AMethod('pay', { id: protocolId, paymentAmount: totalAmount }, orderAgentToken);
        console.log(`Payment of ${totalAmount} completed`);
        
        // Step 8: Complete the order
        console.log('\n--- Step 8: Completing the order ---');
        await callA2AMethod('complete', { id: protocolId }, orderAgentToken);
        console.log('Order completed');
        
        // Step 9: Final status check
        console.log('\n--- Step 9: Final status check ---');
        try {
            await callA2AMethod('getstatus', { id: protocolId }, orderAgentToken);
            console.error('❌ Expected error when calling getstatus in completed state, but call succeeded');
            throw new Error('getstatus should not be allowed in completed state');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes('Illegal protocol state')) {
                console.log('✅ Correctly received error when calling getstatus in completed state:', error.response.data.error);
            } else {
                console.error('❌ Unexpected error when calling getstatus in completed state:', error.response?.data || error.message);
                throw error;
            }
        }
        
        console.log('\n✅ Complete workflow test passed!');
        
    } catch (error) {
        console.error('\n❌ Workflow test failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('Starting OrderCommitment NPL protocol tests...\n');
    
    try {
        await testCompleteWorkflow();
        console.log('\n🎉 All tests completed successfully!');
    } catch (error) {
        console.error('\n💥 Tests failed:', error.message);
        process.exit(1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    createProtocolInstance,
    testCompleteWorkflow,
    runTests
}; 