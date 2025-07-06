const axios = require('axios');
const { getTechnicalUserToken } = require('./token-utils');

const A2A_SERVER_URL = 'http://localhost:8000';

/**
 * Test agent communication functionality
 */
async function testAgentCommunication() {
    console.log('🧪 Testing Agent Communication System...\n');
    
    try {
        // Get technical user token
        const token = await getTechnicalUserToken();
        
        // Test 1: Discover existing agents
        console.log('📝 Test 1: Agent Discovery');
        const discoveryResponse = await discoverAgents();
        console.log(`✅ Discovered ${discoveryResponse.total} agents`);
        
        // Find the Docker-based agents (using service names)
        const dockerAgents = discoveryResponse.agents.filter(agent => 
            agent.url.includes('buyer-agent') || agent.url.includes('seller-agent')
        );
        
        if (dockerAgents.length < 2) {
            throw new Error('Need at least 2 Docker-based agents for testing');
        }
        
        const buyerAgent = dockerAgents.find(agent => agent.url.includes('buyer-agent'));
        const sellerAgent = dockerAgents.find(agent => agent.url.includes('seller-agent'));
        
        if (!buyerAgent || !sellerAgent) {
            throw new Error('Could not find both buyer and seller agents');
        }
        
        console.log(`✅ Using existing Buyer Agent: ${buyerAgent.agentId}`);
        console.log(`✅ Using existing Seller Agent: ${sellerAgent.agentId}\n`);
        
        // Test 2: Agent Discovery (detailed)
        console.log('🔍 Test 2: Agent Discovery Details');
        
        // Test by organization
        const orgDiscovery = await discoverAgents({ organization: 'enterprise' });
        console.log(`✅ Found ${orgDiscovery.total} enterprise agents`);
        
        // Test by skills
        const skillDiscovery = await discoverAgents({ skills: ['Process Order'] });
        console.log(`✅ Found ${skillDiscovery.total} agents with seller skills\n`);
        
        // Test 3: Agent Health Check
        console.log('❤️  Test 3: Agent Health Check');
        const health1 = await getAgentHealth(buyerAgent.agentId);
        const health2 = await getAgentHealth(sellerAgent.agentId);
        console.log(`✅ Buyer Agent health: ${health1.status}`);
        console.log(`✅ Seller Agent health: ${health2.status}\n`);
        
        // Test 4: Send Messages
        console.log('💬 Test 4: Agent Messaging');
        
        // Send a notification message
        const notificationResponse = await sendMessage(buyerAgent.agentId, {
            toAgentId: sellerAgent.agentId,
            type: 'notification',
            content: {
                type: 'purchase_order_created',
                message: 'New purchase order created, awaiting seller confirmation',
                orderId: 'PO-2025-001',
                amount: 5000,
                vendor: 'TechCorp Solutions'
            }
        });
        console.log(`✅ Notification sent: ${notificationResponse.messageId}`);
        
        // Send a broadcast message
        const broadcastResponse = await sendMessage(buyerAgent.agentId, {
            toAgentId: 'all',
            type: 'broadcast',
            content: {
                type: 'system_announcement',
                message: 'Quarterly budget review meeting scheduled',
                scheduledDate: '2025-02-15T10:00:00Z'
            }
        });
        console.log(`✅ Broadcast sent: ${broadcastResponse.messageId}\n`);
        
        // Test 5: Start Collaboration
        console.log('🤝 Test 5: Agent Collaboration');
        const collaborationResponse = await startCollaboration(buyerAgent.agentId, {
            targetAgentId: sellerAgent.agentId,
            type: 'workflow',
            details: {
                name: 'Purchase Order Fulfillment Workflow',
                parameters: {
                    orderId: 'PO-2025-001',
                    amount: 5000,
                    vendor: 'TechCorp Solutions',
                    deliveryDate: '2025-02-15T10:00:00Z'
                },
                expectedOutcomes: [
                    'Order confirmed by seller',
                    'Inventory availability confirmed',
                    'Delivery scheduled'
                ]
            }
        });
        console.log(`✅ Collaboration started: ${collaborationResponse.collaborationId}`);
        console.log(`✅ Collaboration status: ${collaborationResponse.status}\n`);
        
        // Test 6: Message History
        console.log('📜 Test 6: Message History');
        const messageHistory = await getMessageHistory(buyerAgent.agentId);
        console.log(`✅ Retrieved ${messageHistory.total} messages for Buyer Agent`);
        
        const conversation = await getConversation(buyerAgent.agentId, sellerAgent.agentId);
        console.log(`✅ Retrieved ${conversation.total} messages in conversation\n`);
        
        // Test 7: Statistics
        console.log('📊 Test 7: System Statistics');
        const registryStats = await getRegistryStats();
        console.log(`✅ Registry stats: ${registryStats.totalAgents} total agents, ${registryStats.activeAgents} active`);
        
        const communicationStats = await getCommunicationStats();
        console.log(`✅ Communication stats: ${communicationStats.totalMessages} total messages, ${communicationStats.activeConversations} active conversations\n`);
        
        // Test 8: Heartbeat Updates
        console.log('💓 Test 8: Heartbeat Updates');
        await updateHeartbeat(buyerAgent.agentId);
        await updateHeartbeat(sellerAgent.agentId);
        console.log('✅ Heartbeats updated for both agents\n');
        
        console.log('🎉 All agent communication tests passed!\n');
        
        // Display summary
        console.log('📋 Test Summary:');
        console.log('✅ Agent discovery');
        console.log('✅ Agent health monitoring');
        console.log('✅ Message sending (notification, broadcast)');
        console.log('✅ Collaboration workflow');
        console.log('✅ Message history and conversations');
        console.log('✅ System statistics');
        console.log('✅ Heartbeat management');
        
        return {
            success: true,
            agents: [buyerAgent, sellerAgent],
            stats: { registryStats, communicationStats }
        };
        
    } catch (error) {
        console.error('❌ Agent communication test failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Discover agents
 */
async function discoverAgents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.organization) params.append('organization', filters.organization);
    if (filters.capabilities) params.append('capabilities', filters.capabilities.join(','));
    if (filters.skills) params.append('skills', filters.skills.join(','));
    if (filters.tags) params.append('tags', filters.tags.join(','));
    
    const response = await axios.get(`${A2A_SERVER_URL}/agents/discover?${params}`);
    return response.data;
}

/**
 * Get agent health
 */
async function getAgentHealth(agentId) {
    const response = await axios.get(`${A2A_SERVER_URL}/agents/agents/${agentId}/health`);
    return response.data;
}

/**
 * Send a message
 */
async function sendMessage(fromAgentId, messageRequest) {
    const response = await axios.post(`${A2A_SERVER_URL}/agents/message`, {
        fromAgentId,
        ...messageRequest
    });
    return response.data;
}

/**
 * Start collaboration
 */
async function startCollaboration(fromAgentId, collaborationRequest) {
    const response = await axios.post(`${A2A_SERVER_URL}/agents/collaborate`, {
        fromAgentId,
        ...collaborationRequest
    });
    return response.data;
}

/**
 * Get message history
 */
async function getMessageHistory(agentId, limit = 50) {
    const response = await axios.get(`${A2A_SERVER_URL}/agents/messages/${agentId}?limit=${limit}`);
    return response.data;
}

/**
 * Get conversation
 */
async function getConversation(agentId1, agentId2, limit = 50) {
    const response = await axios.get(`${A2A_SERVER_URL}/agents/conversation/${agentId1}/${agentId2}?limit=${limit}`);
    return response.data;
}

/**
 * Get registry statistics
 */
async function getRegistryStats() {
    const response = await axios.get(`${A2A_SERVER_URL}/agents/stats/registry`);
    return response.data;
}

/**
 * Get communication statistics
 */
async function getCommunicationStats() {
    const response = await axios.get(`${A2A_SERVER_URL}/agents/stats/communication`);
    return response.data;
}

/**
 * Update heartbeat
 */
async function updateHeartbeat(agentId) {
    const response = await axios.post(`${A2A_SERVER_URL}/agents/heartbeat/${agentId}`);
    return response.data;
}

// Export functions for use in other test files
module.exports = {
    testAgentCommunication,
    discoverAgents,
    getAgentHealth,
    sendMessage,
    startCollaboration,
    getMessageHistory,
    getConversation,
    getRegistryStats,
    getCommunicationStats,
    updateHeartbeat
};

// Run tests if this file is executed directly
if (require.main === module) {
    testAgentCommunication()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Agent communication tests completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ Agent communication tests failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ Test execution failed:', error);
            process.exit(1);
        });
} 