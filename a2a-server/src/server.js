const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { findMethodMapping } = require('./method-mappings');
const { getProtocolSkills, getAllProtocols } = require('./agent-skills');
const { v4: uuidv4 } = require('uuid');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Import generated method handlers
const { RfpWorkflow_getRfpDetails } = require('./method-handlers');
const { RfpWorkflow_submitForApproval } = require('./method-handlers');
const { RfpWorkflow_approveBudget } = require('./method-handlers');
const { RfpWorkflow_rejectBudget } = require('./method-handlers');
const { RfpWorkflow_activateRfp } = require('./method-handlers');
const { RfpWorkflow_cancelRfp } = require('./method-handlers');
const { RfpWorkflow_cancelRfpByFinance } = require('./method-handlers');
const { RfpWorkflow_getCurrentBudget } = require('./method-handlers');
const { RfpWorkflow_getBudgetApproval } = require('./method-handlers');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://npl-engine:12000';

// Agent registry for tracking registered agents
const agentRegistry = new Map();
const agentHeartbeats = new Map();

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Validate JWT token from multiple IdPs
 */
function validateToken(token) {
    if (!token) {
        throw new Error('No token provided');
    }

    try {
        // Decode token to get issuer
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.iss) {
            throw new Error('Invalid token format');
        }

        // Validate based on issuer (IdP)
        // In production, you would validate against each IdP's public keys
        const trustedIssuers = [
            'http://localhost:11000/realms/noumena', // Main Keycloak (localhost)
            'http://keycloak:11000/realms/noumena', // Main Keycloak (Docker service)
            'http://localhost:8081/realms/procurement', // Procurement Keycloak
            'http://localhost:8082/realms/finance' // Finance Keycloak
        ];

        if (!trustedIssuers.includes(decoded.iss)) {
            throw new Error(`Untrusted issuer: ${decoded.iss}`);
        }

        return decoded;
    } catch (error) {
        throw new Error(`Token validation failed: ${error.message}`);
    }
}

/**
 * Handle listMyProtocols discovery method
 */
async function handleListMyProtocols(params, token, res) {
    try {
        const { package, protocol } = params;
        
        if (!package || !protocol) {
            return res.status(400).json({
                error: 'Missing required parameters: package, protocol'
            });
        }

        // Query NPL engine with agent's token
        const nplResponse = await fetch(
            `${NPL_ENGINE_URL}/npl/${package}/${protocol}/`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!nplResponse.ok) {
            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText}`);
        }

        const protocols = await nplResponse.json();

        res.json({
            success: true,
            result: {
                protocols: protocols,
                count: protocols.length,
                package: package,
                protocol: protocol
            },
            method: `${package}.${protocol}.listMyProtocols`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('listMyProtocols error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle getMyProtocolContent discovery method
 */
async function handleGetMyProtocolContent(params, token, res) {
    try {
        const { protocolId, package, protocol } = params;
        
        if (!protocolId || !package || !protocol) {
            return res.status(400).json({
                error: 'Missing required parameters: protocolId, package, protocol'
            });
        }

        // Query NPL engine with agent's token
        const nplResponse = await fetch(
            `${NPL_ENGINE_URL}/npl/${package}/${protocol}/${protocolId}/`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!nplResponse.ok) {
            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText}`);
        }

        const protocolContent = await nplResponse.json();

        res.json({
            success: true,
            result: {
                protocolId: protocolId,
                content: protocolContent
            },
            method: `${package}.${protocol}.getMyProtocolContent`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('getMyProtocolContent error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Agent registration endpoint
 */
app.post('/agents/register', (req, res) => {
    try {
        const { agent } = req.body;
        
        if (!agent || !agent.name || !agent.url) {
            return res.status(400).json({
                error: 'Missing required agent information: name, url'
            });
        }

        // Generate unique agent ID
        const agentId = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        
        // Store agent information
        agentRegistry.set(agentId, {
            ...agent,
            agentId,
            registeredAt: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            status: 'active'
        });

        console.log(`✅ Agent registered: ${agentId} (${agent.name})`);
        
        res.json({
            agentId,
            message: 'Agent registered successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Agent registration error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Agent heartbeat endpoint
 */
app.post('/agents/heartbeat/:agentId', (req, res) => {
    try {
        const { agentId } = req.params;
        
        if (!agentRegistry.has(agentId)) {
            return res.status(404).json({
                error: 'Agent not found',
                timestamp: new Date().toISOString()
            });
        }

        // Update heartbeat
        const agent = agentRegistry.get(agentId);
        agent.lastHeartbeat = new Date().toISOString();
        agent.status = 'active';
        agentRegistry.set(agentId, agent);

        res.json({
            message: 'Heartbeat received',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Agent heartbeat error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Agent discovery endpoint
 */
app.get('/agents/discover', (req, res) => {
    try {
        const { organization, skills, tags } = req.query;
        
        let agents = Array.from(agentRegistry.values());
        
        // Filter by organization
        if (organization) {
            agents = agents.filter(agent => 
                agent.organization && agent.organization.toLowerCase().includes(organization.toLowerCase())
            );
        }
        
        // Filter by skills
        if (skills) {
            const skillArray = Array.isArray(skills) ? skills : [skills];
            agents = agents.filter(agent => 
                agent.skills && skillArray.some(skill => 
                    agent.skills.some(agentSkill => 
                        agentSkill.toLowerCase().includes(skill.toLowerCase())
                    )
                )
            );
        }
        
        // Filter by tags
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            agents = agents.filter(agent => 
                agent.tags && tagArray.some(tag => 
                    agent.tags.some(agentTag => 
                        agentTag.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        res.json({
            agents,
            total: agents.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Agent discovery error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Get agent health status
 */
app.get('/agents/agents/:agentId/health', (req, res) => {
    try {
        const { agentId } = req.params;
        
        if (!agentRegistry.has(agentId)) {
            return res.status(404).json({
                error: 'Agent not found',
                timestamp: new Date().toISOString()
            });
        }

        const agent = agentRegistry.get(agentId);
        const lastHeartbeat = new Date(agent.lastHeartbeat);
        const now = new Date();
        const timeSinceHeartbeat = now - lastHeartbeat;
        
        // Consider agent inactive if no heartbeat for 2 minutes
        const isActive = timeSinceHeartbeat < 120000;

        res.json({
            agentId,
            status: isActive ? 'active' : 'inactive',
            lastHeartbeat: agent.lastHeartbeat,
            timeSinceHeartbeat: timeSinceHeartbeat,
            agent: {
                name: agent.name,
                description: agent.description,
                url: agent.url,
                capabilities: agent.capabilities,
                skills: agent.skills,
                organization: agent.organization,
                version: agent.version,
                tags: agent.tags
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Agent health check error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Get registry statistics
 */
app.get('/agents/stats/registry', (req, res) => {
    try {
        const agents = Array.from(agentRegistry.values());
        const now = new Date();
        
        const activeAgents = agents.filter(agent => {
            const lastHeartbeat = new Date(agent.lastHeartbeat);
            return (now - lastHeartbeat) < 120000; // 2 minutes
        });

        res.json({
            totalAgents: agents.length,
            activeAgents: activeAgents.length,
            inactiveAgents: agents.length - activeAgents.length,
            organizations: [...new Set(agents.map(a => a.organization).filter(Boolean))],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Registry stats error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * A2A method execution endpoint (NPL Integration)
 */
app.post('/a2a/method', async (req, res) => {
    try {
        const { package, protocol, method, params = {}, token } = req.body;

        if (!package || !protocol || !method || !token) {
            return res.status(400).json({
                error: 'Missing required parameters: package, protocol, method, token'
            });
        }

        // Validate token at A2A level
        const claims = validateToken(token);

        // Handle discovery methods
        if (method === 'listMyProtocols') {
            return await handleListMyProtocols(params, token, res);
        }
        
        if (method === 'getMyProtocolContent') {
            return await handleGetMyProtocolContent(params, token, res);
        }

        // Handle with NPL engine
        console.log(`Routing to NPL engine: ${package}.${protocol}.${method}`);
        const mapping = findMethodMapping(package, protocol, method);
        if (!mapping) {
            return res.status(404).json({
                error: `Method ${method} not found for ${package}.${protocol}`
            });
        }
        const result = await executeMethod(mapping.operationId, {
            ...params,
            token
        });

        res.json({
            success: true,
            result,
            method: `${package}.${protocol}.${method}`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('A2A method execution error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Execute NPL method by name
 */
async function executeMethod(methodName, params) {
    switch (methodName) {
        case 'RfpWorkflow_getRfpDetails':
            return await RfpWorkflow_getRfpDetails(params);
        case 'RfpWorkflow_submitForApproval':
            return await RfpWorkflow_submitForApproval(params);
        case 'RfpWorkflow_approveBudget':
            return await RfpWorkflow_approveBudget(params);
        case 'RfpWorkflow_rejectBudget':
            return await RfpWorkflow_rejectBudget(params);
        case 'RfpWorkflow_activateRfp':
            return await RfpWorkflow_activateRfp(params);
        case 'RfpWorkflow_cancelRfp':
            return await RfpWorkflow_cancelRfp(params);
        case 'RfpWorkflow_cancelRfpByFinance':
            return await RfpWorkflow_cancelRfpByFinance(params);
        case 'RfpWorkflow_getCurrentBudget':
            return await RfpWorkflow_getCurrentBudget(params);
        case 'RfpWorkflow_getBudgetApproval':
            return await RfpWorkflow_getBudgetApproval(params);
        default:
            throw new Error(`Unknown method: ${methodName}`);
    }
}

/**
 * Get available protocols and methods
 */
app.get('/a2a/skills', (req, res) => {
    try {
        const nplProtocols = getAllProtocols();
        const nplSkills = nplProtocols.map(protocol => getProtocolSkills(protocol.package, protocol.protocol));

        res.json({
            protocols: nplProtocols.map(p => ({ package: p.package, protocol: p.protocol })),
            skills: nplSkills,
            handlers: {
                npl: nplProtocols.map(p => ({ package: p.package, protocol: p.protocol }))
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'A2A Server (NPL Integration)',
        npl_integration: true,
        timestamp: new Date().toISOString()
    });
});

/**
 * Agent message relay endpoint
 */
app.post('/agents/message', async (req, res) => {
    try {
        console.log('📨 Message relay endpoint called');
        const { fromAgentId, toAgentId, type, content } = req.body;
        if (!fromAgentId || !toAgentId || !type || !content) {
            return res.status(400).json({
                status: 'failed',
                error: 'Missing required fields: fromAgentId, toAgentId, type, content'
            });
        }
        if (!agentRegistry.has(fromAgentId)) {
            return res.status(400).json({
                status: 'failed',
                error: `Sender agent not found: ${fromAgentId}`
            });
        }
        const messageId = uuidv4();
        const messagePayload = {
            messageId,
            fromAgentId,
            toAgentId,
            type,
            content,
            timestamp: new Date().toISOString()
        };

        // Handle broadcast messages
        console.log(`🔍 Checking if toAgentId '${toAgentId}' is 'all'`);
        if (toAgentId === 'all') {
            const allAgents = Array.from(agentRegistry.values()).filter(agent => agent.agentId !== fromAgentId);
            const deliveryResults = [];
            let successCount = 0;
            let failureCount = 0;

            for (const agent of allAgents) {
                try {
                    const response = await fetch(`${agent.url}/a2a/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...messagePayload,
                            toAgentId: agent.agentId
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        deliveryResults.push({ agentId: agent.agentId, status: 'delivered', result });
                        successCount++;
                    } else {
                        deliveryResults.push({ agentId: agent.agentId, status: 'failed', error: `HTTP ${response.status}` });
                        failureCount++;
                    }
                } catch (err) {
                    deliveryResults.push({ agentId: agent.agentId, status: 'failed', error: err.message });
                    failureCount++;
                }
            }

            console.log(`📨 Broadcast message ${messageId} delivered to ${successCount} agents, ${failureCount} failures`);
            res.json({ 
                messageId, 
                status: 'broadcast_completed', 
                delivered: successCount,
                failed: failureCount,
                total: allAgents.length,
                deliveryResults 
            });
            return;
        }

        // Handle direct messages
        if (!agentRegistry.has(toAgentId)) {
            return res.status(400).json({
                status: 'failed',
                error: `Recipient agent not found: ${toAgentId}`
            });
        }
        
        const recipient = agentRegistry.get(toAgentId);
        const recipientUrl = recipient.url;
        if (!recipientUrl) {
            return res.status(400).json({
                status: 'failed',
                error: 'Recipient agent has no URL registered'
            });
        }

        let deliveryResult = null;
        try {
            const response = await fetch(`${recipientUrl}/a2a/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messagePayload)
            });
            if (!response.ok) {
                throw new Error(`Recipient responded with status ${response.status}`);
            }
            deliveryResult = await response.json();
            console.log(`📨 Message ${messageId} delivered from ${fromAgentId} to ${toAgentId}`);
            res.json({ messageId, status: 'delivered', deliveryResult });
        } catch (err) {
            console.warn(`⚠️ Message delivery failed: ${err.message}`);
            res.status(400).json({
                messageId,
                status: 'failed',
                error: 'Network error: No response received',
                details: err.message
            });
        }
    } catch (error) {
        console.error('Agent message relay error:', error);
        res.status(500).json({
            status: 'failed',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log("A2A Server (NPL Integration) running on port " + PORT);
    console.log("NPL Integration: Enabled");
    console.log("Available protocols: " + getAllProtocols().map(p => `${p.package}.${p.protocol}`).join(", "));
});

module.exports = app;