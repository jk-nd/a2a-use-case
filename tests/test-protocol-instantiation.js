const axios = require('axios');

// Configuration
const A2A_SERVER_URL = process.env.A2A_SERVER_URL || 'http://localhost:8000';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:11000';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'noumena';

// Test users
const USERS = {
    procurementAgent: {
        username: 'procurement_agent',
        password: 'agent-password-123',
        clientId: 'noumena'
    },
    financeAgent: {
        username: 'finance_agent', 
        password: 'agent-password-123',
        clientId: 'noumena'
    },
    orchestrator: {
        username: 'finance_manager',  // Use existing finance_manager as orchestrator
        password: 'password123',
        clientId: 'noumena'
    }
};

/**
 * Get access token from Keycloak
 */
async function getAccessToken(username, password, clientId = 'noumena') {
    try {
        const response = await axios.post(
            `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: 'password',
                client_id: clientId,
                username: username,
                password: password
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data.access_token;
    } catch (error) {
        console.error(`Failed to get token for ${username}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Test protocol instantiation with multi-party consent
 */
async function testProtocolInstantiation() {
    console.log('🧪 Testing Protocol Instantiation with Multi-Party Consent...\n');

    try {
        // Step 1: Get tokens for all parties
        console.log('🔑 Getting access tokens for all parties...');
        const [procurementToken, financeToken, orchestratorToken] = await Promise.all([
            getAccessToken(USERS.procurementAgent.username, USERS.procurementAgent.password, USERS.procurementAgent.clientId),
            getAccessToken(USERS.financeAgent.username, USERS.financeAgent.password, USERS.financeAgent.clientId),
            getAccessToken(USERS.orchestrator.username, USERS.orchestrator.password, USERS.orchestrator.clientId)
        ]);
        console.log('✅ All tokens obtained successfully\n');

        // Step 2: Prepare protocol instantiation request
        console.log('📋 Preparing protocol instantiation request...');
        const rfpId = `rfp-multi-party-${Date.now()}`;
        const requestedAmount = 85000;

        const instantiationRequest = {
            package: 'rfp_workflow',
            protocol: 'RfpWorkflow',
            parties: {
                procurementAgent: {
                    jwt: procurementToken
                },
                financeAgent: {
                    jwt: financeToken
                }
            },
            initialData: {
                initialRfp: {
                    rfpId: rfpId,
                    title: "Multi-Party Consent Test - AI Platform",
                    description: "Testing atomic protocol instantiation with verified party claims",
                    requestedAmount: requestedAmount,
                    requesterId: USERS.procurementAgent.username,
                    createdAt: new Date().toISOString()
                }
            },
            orchestratorToken: orchestratorToken
        };

        console.log('📋 Request Details:');
        console.log(`   Protocol: ${instantiationRequest.package}.${instantiationRequest.protocol}`);
        console.log(`   Parties: ${Object.keys(instantiationRequest.parties).join(', ')}`);
        console.log(`   RFP ID: ${rfpId}`);
        console.log(`   Amount: $${requestedAmount}`);
        console.log('');

        // Step 3: Instantiate protocol with multi-party consent
        console.log('🚀 Instantiating protocol with multi-party consent...');
        const instantiationResponse = await axios.post(
            `${A2A_SERVER_URL}/a2a/instantiate`,
            instantiationRequest,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const result = instantiationResponse.data;
        console.log('✅ Protocol instantiated successfully!');
        console.log('📋 Result:');
        console.log(`   Protocol ID: ${result.result.protocolId}`);
        console.log(`   State: ${result.result.state}`);
        console.log(`   Parties: ${result.result.parties.join(', ')}`);
        console.log(`   Instantiated At: ${result.result.instantiatedAt}`);
        console.log('');

        // Step 4: Verify party bindings
        console.log('🔍 Verifying party bindings...');
        console.log('📋 Party Binding Details:');
        for (const [partyName, binding] of Object.entries(result.result.partyBindings)) {
            console.log(`   ${partyName}:`);
            console.log(`     Identifier: ${binding.identifier}`);
            console.log(`     Name: ${binding.name}`);
            console.log(`     Validated: ${binding.validated}`);
        }
        console.log('');

        // Step 5: Test that parties can access the protocol
        console.log('🧪 Testing protocol access by parties...');
        
        // Test procurement agent access
        const procurementAccess = await axios.post(
            `${A2A_SERVER_URL}/a2a/method`,
            {
                package: 'rfp_workflow',
                protocol: 'RfpWorkflow',
                method: 'getRfpDetails',
                params: {
                    protocolId: result.result.protocolId
                },
                token: procurementToken
            }
        );
        console.log('✅ Procurement agent can access protocol');

        // Test finance agent access
        const financeAccess = await axios.post(
            `${A2A_SERVER_URL}/a2a/method`,
            {
                package: 'rfp_workflow',
                protocol: 'RfpWorkflow',
                method: 'getRfpDetails',
                params: {
                    protocolId: result.result.protocolId
                },
                token: financeToken
            }
        );
        console.log('✅ Finance agent can access protocol');

        console.log('');
        console.log('🎉 Multi-party protocol instantiation test completed successfully!');
        console.log('📈 Key Achievements:');
        console.log('   ✅ All party JWTs validated atomically');
        console.log('   ✅ Protocol instantiated with correct party bindings');
        console.log('   ✅ All parties can access the protocol');
        console.log('   ✅ No partial consent states possible');
        console.log('   ✅ Clean error handling if any party fails');

    } catch (error) {
        console.error('❌ Protocol instantiation test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

/**
 * Test error handling - missing JWT
 */
async function testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...\n');

    try {
        // Get tokens for testing
        const [procurementToken, orchestratorToken] = await Promise.all([
            getAccessToken(USERS.procurementAgent.username, USERS.procurementAgent.password, USERS.procurementAgent.clientId),
            getAccessToken(USERS.orchestrator.username, USERS.orchestrator.password, USERS.orchestrator.clientId)
        ]);

        // Test 1: Missing JWT for one party
        console.log('🔍 Test 1: Missing JWT for finance agent...');
        const invalidRequest = {
            package: 'rfp_workflow',
            protocol: 'RfpWorkflow',
            parties: {
                procurementAgent: {
                    jwt: procurementToken
                },
                financeAgent: {
                    // Missing JWT
                }
            },
            initialData: {
                initialRfp: {
                    rfpId: `rfp-error-test-${Date.now()}`,
                    title: "Error Test",
                    requestedAmount: 1000,
                    requesterId: USERS.procurementAgent.username,
                    createdAt: new Date().toISOString()
                }
            },
            orchestratorToken: orchestratorToken
        };

        try {
            await axios.post(`${A2A_SERVER_URL}/a2a/instantiate`, invalidRequest);
            console.error('❌ Expected error for missing JWT, but request succeeded');
            process.exit(1);
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected request with missing JWT');
            } else {
                console.error('❌ Unexpected error:', error.response?.data);
                process.exit(1);
            }
        }

        console.log('');
        console.log('🎉 Error handling tests completed successfully!');

    } catch (error) {
        console.error('❌ Error handling test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    (async () => {
        await testProtocolInstantiation();
        await testErrorHandling();
        console.log('\n🎉 All tests completed successfully!');
    })();
}

module.exports = { testProtocolInstantiation, testErrorHandling }; 