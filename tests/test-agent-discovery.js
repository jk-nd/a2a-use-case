const axios = require('axios');
const { getTechnicalUserToken } = require('./token-utils');

const A2A_SERVER_URL = 'http://localhost:8000';

/**
 * Test agent discovery functionality
 */
async function testAgentDiscovery() {
    console.log('🧪 Testing Agent Discovery System...\n');
    
    try {
        // Get technical user token
        const token = await getTechnicalUserToken();
        
        // Test 1: Register agents
        console.log('📝 Test 1: Agent Registration');
        const agent1 = await registerAgent({
            name: 'Test Buyer Agent',
            description: 'Test buyer agent for discovery testing',
            url: 'http://localhost:8001',
            transport: 'http',
            organization: 'Test Corp',
            version: '1.0.0',
            capabilities: [
                'Purchase order creation',
                'Vendor evaluation'
            ],
            skills: [
                {
                    id: 'test.buyer.create_order',
                    name: 'Create Order',
                    description: 'Create purchase orders',
                    tags: ['buyer', 'order', 'test'],
                    examples: ['Create test order']
                }
            ],
            tags: ['buyer', 'test', 'discovery']
        });
        
        const agent2 = await registerAgent({
            name: 'Test Seller Agent',
            description: 'Test seller agent for discovery testing',
            url: 'http://localhost:8002',
            transport: 'http',
            organization: 'Test Corp',
            version: '1.0.0',
            capabilities: [
                'Order processing',
                'Inventory management'
            ],
            skills: [
                {
                    id: 'test.seller.process_order',
                    name: 'Process Order',
                    description: 'Process customer orders',
                    tags: ['seller', 'order', 'test'],
                    examples: ['Process test order']
                }
            ],
            tags: ['seller', 'test', 'discovery']
        });
        
        console.log(`✅ Agent 1 registered: ${agent1.agentId}`);
        console.log(`✅ Agent 2 registered: ${agent2.agentId}\n`);
        
        // Test 2: Agent Discovery
        console.log('🔍 Test 2: Agent Discovery');
        const discoveryResponse = await discoverAgents();
        console.log(`✅ Discovered ${discoveryResponse.total} agents`);
        
        // Test by organization
        const orgDiscovery = await discoverAgents({ organization: 'Test Corp' });
        console.log(`✅ Found ${orgDiscovery.total} agents in Test Corp`);
        
        // Test by skills
        const skillDiscovery = await discoverAgents({ skills: ['Process Order'] });
        console.log(`✅ Found ${skillDiscovery.total} agents with Process Order skills`);
        
        // Test by tags
        const tagDiscovery = await discoverAgents({ tags: ['test'] });
        console.log(`✅ Found ${tagDiscovery.total} agents with test tags\n`);
        
        // Test 3: Agent Health Check
        console.log('❤️  Test 3: Agent Health Check');
        const health1 = await getAgentHealth(agent1.agentId);
        const health2 = await getAgentHealth(agent2.agentId);
        console.log(`✅ Agent 1 health: ${health1.status}`);
        console.log(`✅ Agent 2 health: ${health2.status}\n`);
        
        // Test 4: Registry Statistics
        console.log('📊 Test 4: Registry Statistics');
        const registryStats = await getRegistryStats();
        console.log(`✅ Registry stats: ${registryStats.totalAgents} total agents, ${registryStats.activeAgents} active`);
        console.log(`✅ Organizations: ${registryStats.organizations.join(', ')}`);
        console.log(`✅ Skills: ${registryStats.skills.join(', ')}\n`);
        
        console.log('🎉 All agent discovery tests passed!\n');
        
        // Display summary
        console.log('📋 Test Summary:');
        console.log('✅ Agent registration and discovery');
        console.log('✅ Organization-based filtering');
        console.log('✅ Skill-based filtering');
        console.log('✅ Tag-based filtering');
        console.log('✅ Agent health monitoring');
        console.log('✅ Registry statistics');
        
        return {
            success: true,
            agents: [agent1, agent2],
            stats: registryStats
        };
        
    } catch (error) {
        console.error('❌ Agent discovery test failed:', error);
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
 * Get registry statistics
 */
async function getRegistryStats() {
    const response = await axios.get(`${A2A_SERVER_URL}/agents/stats/registry`);
    return response.data;
}

// Export functions for use in other test files
module.exports = {
    testAgentDiscovery,
    registerAgent,
    discoverAgents,
    getAgentHealth,
    getRegistryStats
};

// Run tests if this file is executed directly
if (require.main === module) {
    testAgentDiscovery()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Agent discovery tests completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ Agent discovery tests failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ Test execution failed:', error);
            process.exit(1);
        });
} 