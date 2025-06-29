const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { findMethodMapping } = require('./method-mappings');
const { getProtocolSkills, getAllProtocols } = require('./agent-skills');

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

        const nplData = await nplResponse.json();
        
        // NPL engine returns { items: [...], page: 1 }
        // Extract the items array for the response
        const protocols = nplData.items || [];
        
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

        // Debug logging
        console.log(`Received method: "${method}" (lowercase: "${method.toLowerCase()}")`);

        // Handle discovery methods
        if (method.toLowerCase() === 'listmyprotocols') {
            console.log('Handling listMyProtocols discovery method');
            return await handleListMyProtocols(params, token, res);
        }
        
        if (method.toLowerCase() === 'getmyprotocolcontent') {
            console.log('Handling getMyProtocolContent discovery method');
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

// Start server
app.listen(PORT, () => {
    console.log("A2A Server (NPL Integration) running on port " + PORT);
    console.log("NPL Integration: Enabled");
    console.log("Available protocols: " + getAllProtocols().map(p => `${p.package}.${p.protocol}`).join(", "));
});

module.exports = app;