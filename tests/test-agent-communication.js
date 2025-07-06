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
        
        // Test 1: Register agents
        console.log('📝 Test 1: Agent Registration');
        const agent1 = await registerAgent({
            name: 'Buyer Agent',
            description: 'Handles purchase order creation, vendor evaluation, and contract management',
            url: 'http://localhost:8001',
            transport: 'http',
            organization: 'ACME Corp',
            version: '1.0.0',
            capabilities: [
                'Purchase order creation and management',
                'Vendor evaluation and selection',
                'Procurement workflow automation',
                'Policy enforcement',
                'Budget integration',
                'Contract negotiation'
            ],
            skills: [
                {
                    id: 'buyer.create_purchase_order',
                    name: 'Create Purchase Order',
                    description: 'Create and manage purchase orders',
                    tags: ['buyer', 'procurement', 'purchase', 'order'],
                    examples: ['Create PO for office supplies', 'Submit vendor order']
                },
                {
                    id: 'buyer.evaluate_vendor',
                    name: 'Evaluate Vendor',
                    description: 'Evaluate and select vendors',
                    tags: ['buyer', 'vendor', 'evaluation', 'selection'],
                    examples: ['Assess vendor performance', 'Compare vendor quotes']
                },
                {
                    id: 'buyer.manage_contract',
                    name: 'Manage Contract',
                    description: 'Manage vendor contracts and agreements',
                    tags: ['buyer', 'contract', 'agreement', 'legal'],
                    examples: ['Review contract terms', 'Negotiate pricing']
                }
            ],
            tags: ['buyer', 'procurement', 'purchase', 'vendor', 'enterprise']
        });
        
        const agent2 = await registerAgent({
            name: 'Seller Agent',
            description: 'Handles order fulfillment, inventory management, and sales processing',
            url: 'http://localhost:8002',
            transport: 'http',
            organization: 'ACME Corp',
            version: '1.0.0',
            capabilities: [
                'Order fulfillment and processing',
                'Inventory management',
                'Sales policy enforcement',
                'Pricing and quotation',
                'Delivery coordination',
                'Customer relationship management'
            ],
            skills: [
                {
                    id: 'seller.process_order',
                    name: 'Process Order',
                    description: 'Process and fulfill customer orders',
                    tags: ['seller', 'order', 'fulfillment', 'processing'],
                    examples: ['Process customer order', 'Update order status']
                },
                {
                    id: 'seller.check_inventory',
                    name: 'Check Inventory',
                    description: 'Check and manage inventory levels',
                    tags: ['seller', 'inventory', 'stock', 'availability'],
                    examples: ['Check stock levels', 'Update inventory']
                },
                {
                    id: 'seller.generate_quote',
                    name: 'Generate Quote',
                    description: 'Generate pricing quotes for customers',
                    tags: ['seller', 'quote', 'pricing', 'sales'],
                    examples: ['Create customer quote', 'Calculate pricing']
                }
            ],
            tags: ['seller', 'sales', 'fulfillment', 'inventory', 'enterprise']
        });
        
        console.log(`✅ Agent 1 registered: ${agent1.agentId}`);
        console.log(`✅ Agent 2 registered: ${agent2.agentId}\n`);
        
        // Test 2: Agent Discovery
        console.log('🔍 Test 2: Agent Discovery');
        const discoveryResponse = await discoverAgents();
        console.log(`✅ Discovered ${discoveryResponse.total} agents`);
        
        // Test by organization
        const orgDiscovery = await discoverAgents({ organization: 'ACME Corp' });
        console.log(`✅ Found ${orgDiscovery.total} agents in ACME Corp`);
        
        // Test by skills
        const skillDiscovery = await discoverAgents({ skills: ['Process Order'] });
        console.log(`✅ Found ${skillDiscovery.total} agents with seller skills\n`);
        
        // Test 3: Agent Health Check
        console.log('❤️  Test 3: Agent Health Check');
        const health1 = await getAgentHealth(agent1.agentId);
        const health2 = await getAgentHealth(agent2.agentId);
        console.log(`✅ Agent 1 health: ${health1.status}`);
        console.log(`✅ Agent 2 health: ${health2.status}\n`);
        
        // Test 4: Send Messages
        console.log('💬 Test 4: Agent Messaging');
        
        // Send a notification message
        const notificationResponse = await sendMessage(agent1.agentId, {
            toAgentId: agent2.agentId,
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
        const broadcastResponse = await sendMessage(agent1.agentId, {
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
        const collaborationResponse = await startCollaboration(agent1.agentId, {
            targetAgentId: agent2.agentId,
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
        const messageHistory = await getMessageHistory(agent1.agentId);
        console.log(`✅ Retrieved ${messageHistory.total} messages for Agent 1`);
        
        const conversation = await getConversation(agent1.agentId, agent2.agentId);
        console.log(`✅ Retrieved ${conversation.total} messages in conversation\n`);
        
        // Test 7: Statistics
        console.log('📊 Test 7: System Statistics');
        const registryStats = await getRegistryStats();
        console.log(`✅ Registry stats: ${registryStats.totalAgents} total agents, ${registryStats.activeAgents} active`);
        
        const communicationStats = await getCommunicationStats();
        console.log(`✅ Communication stats: ${communicationStats.totalMessages} total messages, ${communicationStats.activeConversations} active conversations\n`);
        
        // Test 8: Heartbeat Updates
        console.log('💓 Test 8: Heartbeat Updates');
        await updateHeartbeat(agent1.agentId);
        await updateHeartbeat(agent2.agentId);
        console.log('✅ Heartbeats updated for both agents\n');
        
        console.log('🎉 All agent communication tests passed!\n');
        
        // Display summary
        console.log('📋 Test Summary:');
        console.log('✅ Agent registration and discovery');
        console.log('✅ Agent health monitoring');
        console.log('✅ Message sending (notification, broadcast)');
        console.log('✅ Collaboration workflow');
        console.log('✅ Message history and conversations');
        console.log('✅ System statistics');
        console.log('✅ Heartbeat management');
        
        return {
            success: true,
            agents: [agent1, agent2],
            stats: { registryStats, communicationStats }
        };
        
    } catch (error) {
        console.error('❌ Agent communication test failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Register an agent
 */
async function registerAgent(agentData) {
    const response = await axios.post(`${A2A_SERVER_URL}/agents/register`, {
        agent: agentData
    });
    return response.data;
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
    registerAgent,
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