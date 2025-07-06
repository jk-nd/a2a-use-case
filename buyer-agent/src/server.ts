import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Import Google A2A types
import { 
  AgentCard, 
  AgentSkill, 
  AgentCapabilities,
  AgentProvider,
  SecurityScheme,
  HTTPAuthSecurityScheme,
  JSONRPCRequest, 
  JSONRPCErrorResponse,
  JSONRPCSuccessResponse,
  InternalError,
  MethodNotFoundError,
  InvalidParamsError,
  RfpData,
  CreateRfpParams,
  SubmitRfpParams,
  TrackRfpParams
} from './types';

const app = express();
const PORT = process.env.PORT || 8001;

// Configuration
const A2A_HUB_URL = process.env.A2A_HUB_URL || 'http://localhost:8000';
const AGENT_URL = process.env.AGENT_URL || `http://localhost:${PORT}`;

// In-memory storage for RFPs (minimal)
const rfpStore: Map<string, RfpData> = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - Procurement Agent: ${req.method} ${req.path}`);
  next();
});

// Verify JWT token middleware (simplified)
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }
  
  const token = authHeader.replace('Bearer ', '');
  (req as any).token = token;
  next();
};

// Call A2A Hub for policy enforcement
async function callA2AHub(action: string, agentId: string, context: any, token: string) {
  try {
    console.log(`Calling A2A Hub: ${action} for ${agentId}`);
    
    const response = await axios.post(
      `${A2A_HUB_URL}/a2a/request`,
      {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: action,
        params: {
          agent_id: agentId,
          ...context
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log(`A2A Hub response:`, response.data);
    
    return {
      success: true,
      data: response.data.result
    };
  } catch (error: any) {
    console.error('Error calling A2A Hub:', error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

// Create agent skills with Google A2A structure
const agentSkills: AgentSkill[] = [
  {
    id: 'procurement.create_rfp',
    name: 'Create RFP',
    description: 'Create a new Request for Proposal with title, amount, and optional metadata',
    tags: ['procurement', 'rfp', 'creation'],
    examples: [
      'Create RFP for software development project',
      'Create RFP for office supplies with budget of $50,000'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  },
  {
    id: 'procurement.submit_rfp',
    name: 'Submit RFP',
    description: 'Submit an RFP for approval workflow and policy enforcement',
    tags: ['procurement', 'rfp', 'workflow', 'approval'],
    examples: [
      'Submit RFP for finance approval',
      'Submit RFP for compliance review'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  },
  {
    id: 'procurement.track_rfp',
    name: 'Track RFP',
    description: 'Track the status and progress of an RFP through the approval workflow',
    tags: ['procurement', 'rfp', 'status', 'tracking'],
    examples: [
      'Check RFP approval status',
      'Get RFP workflow progress'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  }
];

// Create agent capabilities
const agentCapabilities: AgentCapabilities = {
  streaming: false,
  pushNotifications: false,
  stateTransitionHistory: true,
  extensions: [
    {
      uri: 'https://developers.google.com/identity/protocols/oauth2',
      description: 'OAuth 2.0 authentication for secure access',
      required: false
    }
  ]
};

// Create security scheme
const securityScheme: HTTPAuthSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Bearer token authentication'
};

// Create agent provider
const agentProvider: AgentProvider = {
  organization: 'A2A Demo Organization',
  url: 'https://github.com/your-org/a2a-demo'
};

// Create agent card with full Google A2A structure
const agentCard: AgentCard = {
  name: 'Procurement Agent',
  description: 'Enterprise procurement agent for Request for Proposal (RFP) workflow management with policy enforcement',
  url: `${AGENT_URL}/a2a`,
  preferredTransport: 'JSONRPC',
  iconUrl: 'https://example.com/procurement-agent-icon.png',
  provider: agentProvider,
  version: '1.0.0',
  documentationUrl: 'https://github.com/your-org/a2a-demo/docs/procurement-agent',
  capabilities: agentCapabilities,
  securitySchemes: {
    bearerAuth: securityScheme
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  skills: agentSkills,
  supportsAuthenticatedExtendedCard: true
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'procurement-agent',
    timestamp: new Date().toISOString(),
    rfp_count: rfpStore.size
  });
});

// A2A Agent Card endpoint
app.get('/a2a/agent-card', (req, res) => {
  res.json(agentCard);
});

// Agent Communication endpoints (for A2A agent-to-agent messaging)
// Handle agent messages (JSON-RPC at root path)
app.post('/', (req, res) => {
  try {
    const { jsonrpc, id, method, params } = req.body;
    
    console.log(`[Procurement Agent] Received ${method}:`, JSON.stringify(params, null, 2));
    
    if (method === 'agent.message') {
      handleAgentMessage(params.message, res, id);
    } else if (method === 'agent.notification') {
      handleAgentNotification(params.message, res);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      });
    }
  } catch (error: any) {
    console.error('[Procurement Agent] Error handling agent communication:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: 'Internal error'
      }
    });
  }
});

function handleAgentMessage(message: any, res: any, id: any) {
  // Generic, extensible message handler for AI agents
  if (!message || !message.content) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32602,
        message: 'Invalid message format: missing content'
      }
    });
  }
  console.log(`[Buyer Agent] Received message from ${message.fromAgentId}:`, message.content);

  // Generic acknowledgment/echo (future: AI/skills can process content)
  const response = {
      status: 'received',
    message: 'Message received',
    echo: message.content,
    timestamp: new Date().toISOString(),
    // capabilities: ['buyer.create_purchase_order', 'buyer.evaluate_vendor', 'buyer.manage_contract']
  };

  res.json({
    jsonrpc: '2.0',
    id,
    result: response
  });
}

function handleAgentNotification(message: any, res: any) {
  // Generic notification handler for AI agents
  if (!message || !message.content) {
    console.warn('[Buyer Agent] Received malformed notification:', message);
    return res.status(400).send();
  }
  console.log(`[Buyer Agent] Notification from ${message.fromAgentId}:`, message.content);
  // In the future, trigger internal workflows or AI skills here
  res.status(200).send();
}

// A2A Message endpoint (for agent-to-agent communication)
app.post('/', async (req, res) => {
  try {
    const request = req.body;
    
    console.log('Buyer Agent received message:', {
      id: request.id,
      method: request.method,
      params: request.params
    });
    
    // Handle different message types
    if (request.method === 'agent.message') {
      handleAgentMessage(request.params.message, res, request.id);
    } else if (request.method === 'agent.notification') {
      handleAgentNotification(request.params.message, res);
    } else {
      // Fallback to existing A2A request handling
      res.status(400).json({
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      });
    }
  } catch (error: any) {
    console.error('Error handling agent message:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    });
  }
});

// A2A Request endpoint (for backward compatibility)
app.post('/a2a/request', verifyToken, async (req, res) => {
  try {
    const request: JSONRPCRequest = req.body;
    const token = (req as any).token;
    
    console.log('Buyer Agent received request:', {
      id: request.id,
      method: request.method,
      params: request.params
    });
    
    let result: any;
    
    switch (request.method) {
      case 'buyer.create_purchase_order':
        result = await handleCreatePurchaseOrder(request.params, token);
        break;
      case 'buyer.evaluate_vendor':
        result = await handleEvaluateVendor(request.params, token);
        break;
      case 'buyer.manage_contract':
        result = await handleManageContract(request.params, token);
        break;
      default:
        const methodNotFoundError: MethodNotFoundError = {
          code: -32601,
          message: `Method not found: ${request.method}`
        };
        const response: JSONRPCErrorResponse = {
          jsonrpc: '2.0',
          id: request.id || null,
          error: methodNotFoundError
        };
        return res.json(response);
    }
    
    const response: JSONRPCSuccessResponse = {
      jsonrpc: '2.0',
      id: request.id || null,
      result: result
    };
    res.json(response);
    
  } catch (error: any) {
    console.error('Error handling A2A request:', error);
    
    let errorResponse: JSONRPCErrorResponse;
    
    if (error.message.includes('Missing required fields')) {
      const invalidParamsError: InvalidParamsError = {
        code: -32602,
        message: error.message
      };
      errorResponse = {
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: invalidParamsError
      };
    } else {
      const internalError: InternalError = {
        code: -32603,
        message: `Internal error: ${error.message}`
      };
      errorResponse = {
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: internalError
      };
    }
    
    res.json(errorResponse);
  }
});

// Handle Create Purchase Order with proper validation
async function handleCreatePurchaseOrder(params: any, token: string) {
  const { title, amount, description, category, due_date, agent_id } = params as CreateRfpParams;
  
  // Validate required parameters
  if (!title || !amount || !agent_id) {
    throw new Error('Missing required fields: title, amount, agent_id');
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  // Call A2A Hub for policy enforcement
  const policyResult = await callA2AHub('buyer.create_purchase_order', agent_id, {
    title,
    amount,
    description,
    category,
    due_date
  }, token);
  
  if (!policyResult.success) {
    throw new Error(`Policy enforcement failed: ${policyResult.error}`);
  }
  
  // Create Purchase Order
  const poId = `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const purchaseOrder: RfpData = {
    rfp_id: poId,
    title,
    amount,
    status: 'draft',
    created_by: agent_id,
    created_at: new Date().toISOString(),
    description,
    category,
    due_date
  };
  
  rfpStore.set(poId, purchaseOrder);
  
  return {
    po_id: poId,
    status: 'created',
    message: 'Purchase order created successfully',
    timestamp: new Date().toISOString(),
    purchase_order: purchaseOrder
  };
}

// Handle Evaluate Vendor (minimal)
async function handleEvaluateVendor(params: any, token: string) {
  const { vendor_id, criteria, agent_id } = params;
  
  if (!vendor_id || !criteria) {
    throw new Error('Vendor ID and criteria are required');
  }
  
  // Call A2A Hub for policy enforcement
  const hubResponse = await callA2AHub('buyer.evaluate_vendor', agent_id || 'unknown', {
    vendor_id,
    criteria
  }, token);
  
  if (!hubResponse.success) {
    throw new Error(`Policy check failed: ${hubResponse.error}`);
  }
  
  console.log(`Evaluated vendor: ${vendor_id} by ${agent_id}`);
  
  return {
    vendor_id,
    evaluation_score: Math.floor(Math.random() * 100) + 1, // Mock score
    status: 'evaluated',
    message: 'Vendor evaluation completed successfully'
  };
}

// Handle Manage Contract (minimal)
async function handleManageContract(params: any, token: string) {
  const { contract_id, action, agent_id } = params;
  
  if (!contract_id || !action) {
    throw new Error('Contract ID and action are required');
  }
  
  // Call A2A Hub for policy enforcement
  const hubResponse = await callA2AHub('buyer.manage_contract', agent_id || 'unknown', {
    contract_id,
    action
  }, token);
  
  if (!hubResponse.success) {
    throw new Error(`Policy check failed: ${hubResponse.error}`);
  }
  
  console.log(`Managed contract: ${contract_id} with action ${action} by ${agent_id}`);
  
  return {
    contract_id,
    action,
    status: 'processed',
    message: `Contract ${action} completed successfully`
  };
}

/**
 * Register this agent with the A2A service
 */
async function registerWithA2AService() {
  try {
    console.log(`[BUYER] Registering with AGENT_URL: ${AGENT_URL}`);
    const registrationData = {
      agent: {
        name: 'Buyer Agent',
        description: 'Enterprise buyer agent for procurement, vendor evaluation, and purchase order management with policy enforcement',
        url: AGENT_URL,
        transport: 'http',
        capabilities: [
          'Purchase order creation and management',
          'Vendor evaluation and selection',
          'Procurement workflow automation',
          'Policy enforcement',
          'Budget integration',
          'Contract negotiation'
        ],
        skills: [
          'buyer.create_purchase_order',
          'buyer.evaluate_vendor', 
          'buyer.manage_contract'
        ],
        organization: 'enterprise',
        version: '1.0.0',
        tags: ['buyer', 'procurement', 'purchase', 'vendor', 'enterprise']
      }
    };

    const response = await fetch(`${A2A_HUB_URL}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as { agentId: string; message: string };
    console.log(`✅ Successfully registered with A2A service: ${result.agentId}`);
    
    // Start sending heartbeats
    startHeartbeat(result.agentId);
    
    return result.agentId;
  } catch (error) {
    console.error('❌ Failed to register with A2A service:', error);
    // Don't fail startup if registration fails
    return null;
  }
}

/**
 * Send periodic heartbeats to maintain registration
 */
function startHeartbeat(agentId: string) {
  setInterval(async () => {
    try {
      const response = await fetch(`${A2A_HUB_URL}/agents/heartbeat/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Heartbeat failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn('⚠️ Heartbeat error:', error);
    }
  }, 30000); // Send heartbeat every 30 seconds
}

app.post('/a2a/message', async (req, res) => {
  try {
    const { messageId, fromAgentId, toAgentId, type, content, timestamp } = req.body;
    console.log('[BUYER] Received message:', {
      messageId, fromAgentId, toAgentId, type, content, timestamp
    });
    res.json({
      messageId,
      status: 'received',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BUYER] Error in /a2a/message:', error);
    res.status(200).json({
      status: 'received',
      error: (error as any).message,
      receivedAt: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Buyer Agent running on port ${PORT}`);
  console.log(`A2A Hub URL: ${A2A_HUB_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Agent card: http://localhost:${PORT}/a2a/agent-card`);
  
  // Register with A2A service
  await registerWithA2AService();
});

export default app; 