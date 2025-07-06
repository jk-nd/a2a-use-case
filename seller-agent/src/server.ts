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
  BudgetApproval,
  BudgetData,
  ApproveBudgetParams,
  CheckBudgetParams
} from './types';

const app = express();
const PORT = process.env.PORT || 8002;

// Configuration
const A2A_HUB_URL = process.env.A2A_HUB_URL || 'http://localhost:8000';
const AGENT_URL = process.env.AGENT_URL || `http://localhost:${PORT}`;

// In-memory storage for budget approvals and budget data
const budgetApprovals: Map<string, BudgetApproval> = new Map();
const budgetData: Map<string, BudgetData> = new Map();

// Initialize some sample budget data
budgetData.set('IT-2024-001', {
  budget_code: 'IT-2024-001',
  total_budget: 1000000,
  allocated_budget: 200000,
  remaining_budget: 800000,
  fiscal_year: '2024'
});

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - Finance Agent: ${req.method} ${req.path}`);
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

// Handle agent messages (for agent-to-agent communication)
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
  console.log(`[Seller Agent] Received message from ${message.fromAgentId}:`, message.content);

  // Generic acknowledgment/echo (future: AI/skills can process content)
  const response = {
    status: 'received',
    message: 'Message received',
    echo: message.content,
    timestamp: new Date().toISOString(),
    // capabilities: ['seller.process_order', 'seller.check_inventory', 'seller.generate_quote']
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
    console.warn('[Seller Agent] Received malformed notification:', message);
    return res.status(400).send();
  }
  console.log(`[Seller Agent] Notification from ${message.fromAgentId}:`, message.content);
  // In the future, trigger internal workflows or AI skills here
  res.status(200).send();
}

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
    id: 'seller.process_order',
    name: 'Process Order',
    description: 'Process customer orders with inventory validation and fulfillment',
    tags: ['seller', 'order', 'fulfillment', 'inventory'],
    examples: [
      'Process order for 100 laptops',
      'Fulfill customer order with inventory check'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  },
  {
    id: 'seller.check_inventory',
    name: 'Check Inventory',
    description: 'Check product availability and inventory levels',
    tags: ['seller', 'inventory', 'availability', 'stock'],
    examples: [
      'Check inventory for laptop models',
      'Verify stock availability for bulk orders'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  },
  {
    id: 'seller.generate_quote',
    name: 'Generate Quote',
    description: 'Generate pricing quotes for customer orders',
    tags: ['seller', 'quote', 'pricing', 'sales'],
    examples: [
      'Generate quote for 100 laptops',
      'Create pricing proposal for bulk order'
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
      description: 'OAuth 2.0 authentication for secure sales operations',
      required: false
    }
  ]
};

// Create security scheme
const securityScheme: HTTPAuthSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Bearer token authentication for sales operations'
};

// Create agent provider
const agentProvider: AgentProvider = {
  organization: 'A2A Demo Organization',
  url: 'https://github.com/your-org/a2a-demo'
};

// Create agent card with full Google A2A structure
const agentCard: AgentCard = {
  name: 'Seller Agent',
  description: 'Enterprise seller agent for order fulfillment, inventory management, and sales processing with policy enforcement',
  url: `${AGENT_URL}/a2a`,
  preferredTransport: 'JSONRPC',
  iconUrl: 'https://example.com/finance-agent-icon.png',
  provider: agentProvider,
  version: '1.0.0',
  documentationUrl: 'https://github.com/your-org/a2a-demo/docs/finance-agent',
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
    service: 'seller-agent',
    timestamp: new Date().toISOString(),
    budget_approvals_count: budgetApprovals.size,
    budget_data_count: budgetData.size
  });
});

// A2A Agent Card endpoint
app.get('/a2a/agent-card', (req, res) => {
  res.json(agentCard);
});

// A2A Message endpoint (for agent-to-agent communication)
app.post('/', async (req, res) => {
  try {
    const request = req.body;
    
    console.log('Seller Agent received message:', {
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
    
    console.log('Seller Agent received request:', {
      id: request.id,
      method: request.method,
      params: request.params
    });
    
    let result: any;
    
    switch (request.method) {
      case 'seller.process_order':
        result = await handleProcessOrder(request.params, token);
        break;
      case 'seller.check_inventory':
        result = await handleCheckInventory(request.params, token);
        break;
      case 'seller.generate_quote':
        result = await handleGenerateQuote(request.params, token);
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

// Handle Process Order
async function handleProcessOrder(params: any, token: string) {
  const { order_id, items, agent_id } = params;
  
  if (!order_id || !items) {
    throw new Error('Missing required fields: order_id, items');
  }
  
  // Call A2A Hub for policy enforcement
  const hubResponse = await callA2AHub('seller.process_order', agent_id || 'unknown', {
    order_id,
    items
  }, token);
  
  if (!hubResponse.success) {
    throw new Error(`Policy check failed: ${hubResponse.error}`);
  }
  
  console.log(`Processed order: ${order_id} by ${agent_id}`);
  
  return {
    order_id,
    status: 'processed',
    items_processed: items.length,
    message: 'Order processed successfully'
  };
}

// Handle Check Inventory
async function handleCheckInventory(params: any, token: string) {
  const { product_id, quantity } = params;
  
  if (!product_id || !quantity) {
    throw new Error('Missing required fields: product_id, quantity');
  }
  
  // Mock inventory check
  const available = Math.random() > 0.3; // 70% chance of availability
  
  return {
    product_id,
    requested_quantity: quantity,
    available: available,
    available_quantity: available ? quantity : Math.floor(quantity * 0.5),
    message: available ? 'Product is available' : 'Limited inventory available'
  };
}

// Handle Generate Quote
async function handleGenerateQuote(params: any, token: string) {
  const { product_id, quantity, delivery_date } = params;
  
  if (!product_id || !quantity) {
    throw new Error('Missing required fields: product_id, quantity');
  }
  
  // Mock quote generation
  const basePrice = 100;
  const unitPrice = basePrice + Math.floor(Math.random() * 50);
  const totalPrice = unitPrice * quantity;
  const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    quote_id: quoteId,
    product_id,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    delivery_date: delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    message: 'Quote generated successfully'
  };
}

/**
 * Register this agent with the A2A service
 */
async function registerWithA2AService() {
  try {
    console.log(`[SELLER] Registering with AGENT_URL: ${AGENT_URL}`);
    const registrationData = {
      agent: {
        name: 'Seller Agent',
        description: 'Enterprise seller agent for order fulfillment, inventory management, and sales processing with policy enforcement',
        url: AGENT_URL,
        transport: 'http',
        capabilities: [
          'Order fulfillment and processing',
          'Inventory management',
          'Sales policy enforcement',
          'Pricing and quotation',
          'Delivery coordination',
          'Customer relationship management'
        ],
        skills: [
          'seller.process_order',
          'seller.check_inventory',
          'seller.generate_quote'
        ],
        organization: 'enterprise',
        version: '1.0.0',
        tags: ['seller', 'sales', 'fulfillment', 'inventory', 'enterprise']
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
    console.log('[SELLER] Received message:', {
      messageId, fromAgentId, toAgentId, type, content, timestamp
    });
    res.json({
      messageId,
      status: 'received',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SELLER] Error in /a2a/message:', error);
    res.status(200).json({
      status: 'received',
      error: (error as any).message,
      receivedAt: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Seller Agent running on port ${PORT}`);
  console.log(`A2A Hub URL: ${A2A_HUB_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Agent card: http://localhost:${PORT}/a2a/agent-card`);
  
  // Register with A2A service
  await registerWithA2AService();
});

export default app; 