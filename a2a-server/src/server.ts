import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Import A2A types
import { 
  AgentCard, 
  AgentSkill, 
  AgentCapabilities, 
  JSONRPCRequest, 
  JSONRPCResponse,
  JSONRPCErrorResponse,
  JSONRPCSuccessResponse,
  InternalError
} from './types';

// Import generated method handlers and mappings
const { findMethodMapping } = require('./method-mappings');
const { getProtocolSkills, getAllProtocols } = require('./agent-skills');

// Import generated method handlers
const { 
  RfpWorkflow_getRfpDetails,
  RfpWorkflow_submitForApproval,
  RfpWorkflow_approveBudget,
  RfpWorkflow_rejectBudget,
  RfpWorkflow_activateRfp,
  RfpWorkflow_cancelRfp,
  RfpWorkflow_cancelRfpByFinance,
  RfpWorkflow_getCurrentBudget,
  RfpWorkflow_getBudgetApproval
} = require('./method-handlers');

const app = express();
const PORT = process.env.PORT || 8000;

// Configuration
const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://engine:12000';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:11000';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'noumena';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'noumena';

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Validate JWT token from multiple IdPs
 */
function validateToken(token: string) {
    if (!token) {
        throw new Error('No token provided');
    }

    try {
        // Decode token to get issuer
        const decoded = jwt.decode(token) as any;
        if (!decoded || !decoded.iss) {
            throw new Error('Invalid token format');
        }

        // Validate based on issuer (IdP)
        // In production, you would validate against each IdP's public keys
        const trustedIssuers = [
            'http://localhost:11000/realms/noumena', // Main Keycloak
            'http://localhost:8081/realms/procurement', // Procurement Keycloak
            'http://localhost:8082/realms/finance' // Finance Keycloak
        ];

        if (!trustedIssuers.includes(decoded.iss)) {
            throw new Error(`Untrusted issuer: ${decoded.iss}`);
        }

        return decoded;
    } catch (error: any) {
        throw new Error(`Token validation failed: ${error.message}`);
    }
}

/**
 * Execute NPL method by name
 */
async function executeMethod(methodName: string, params: any) {
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'A2A Server (NPL Integration)',
    npl_integration: true,
    timestamp: new Date().toISOString()
  });
});

// A2A method execution endpoint (NPL Integration)
app.post('/a2a/method', async (req, res) => {
    try {
        const { package: pkg, protocol, method, params = {}, token } = req.body;

        if (!pkg || !protocol || !method || !token) {
            return res.status(400).json({
                error: 'Missing required parameters: package, protocol, method, token'
            });
        }

        // Validate token
        const claims = validateToken(token);

        // Handle with NPL engine
        console.log(`Routing to NPL engine: ${pkg}.${protocol}.${method}`);
        const mapping = findMethodMapping(pkg, protocol, method);
        if (!mapping) {
            return res.status(404).json({
                error: `Method ${method} not found for ${pkg}.${protocol}`
            });
        }
        const result = await executeMethod(mapping.operationId, {
            ...params,
            token
        });

        res.json({
            success: true,
            result,
            method: `${pkg}.${protocol}.${method}`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('A2A method execution error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get available protocols and methods
app.get('/a2a/skills', (req, res) => {
    try {
        const nplProtocols = getAllProtocols();
        const nplSkills = nplProtocols.map((protocol: any) => getProtocolSkills(protocol.package, protocol.protocol));

        res.json({
            protocols: nplProtocols.map((p: any) => ({ package: p.package, protocol: p.protocol })),
            skills: nplSkills,
            handlers: {
                npl: nplProtocols.map((p: any) => ({ package: p.package, protocol: p.protocol }))
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Legacy A2A Request endpoint (for backward compatibility)
app.post('/a2a/request', async (req, res) => {
  try {
    const request: JSONRPCRequest = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    
    console.log('Received legacy A2A request:', {
      id: request.id,
      method: request.method,
      agentId: request.params?.agent_id
    });
    
    // Try to map legacy request to new format
    const methodParts = request.method.split('.');
    if (methodParts.length >= 2) {
      const pkg = methodParts[0];
      const protocol = methodParts[1];
      const method = methodParts[2] || 'default';
      
      const mapping = findMethodMapping(pkg, protocol, method);
      if (mapping) {
        const result = await executeMethod(mapping.operationId, {
          ...request.params,
          token
        });
        
        const response: JSONRPCSuccessResponse = {
          jsonrpc: '2.0',
          id: request.id || null,
          result: result
        };
        res.json(response);
        return;
      }
    }
    
    // Fallback to error response
    const response: JSONRPCErrorResponse = {
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32601,
        message: `Method ${request.method} not found`
      }
    };
    res.json(response);
    
  } catch (error: any) {
    console.error('Error handling legacy A2A request:', error);
    
    const response: JSONRPCErrorResponse = {
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
    
    res.json(response);
  }
});

// Start server
app.listen(PORT, () => {
  console.log("A2A Server (NPL Integration) running on port " + PORT);
  console.log("NPL Integration: Enabled");
  console.log("Available protocols: " + getAllProtocols().map((p: any) => `${p.package}.${p.protocol}`).join(", "));
});

export default app; 