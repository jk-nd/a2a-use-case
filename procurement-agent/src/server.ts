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
  url: `http://localhost:${PORT}/a2a`,
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

// A2A Request endpoint
app.post('/a2a/request', verifyToken, async (req, res) => {
  try {
    const request: JSONRPCRequest = req.body;
    const token = (req as any).token;
    
    console.log('Procurement Agent received request:', {
      id: request.id,
      method: request.method,
      params: request.params
    });
    
    let result: any;
    
    switch (request.method) {
      case 'procurement.create_rfp':
        result = await handleCreateRfp(request.params, token);
        break;
      case 'procurement.submit_rfp':
        result = await handleSubmitRfp(request.params, token);
        break;
      case 'procurement.track_rfp':
        result = await handleTrackRfp(request.params, token);
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

// Handle Create RFP with proper validation
async function handleCreateRfp(params: any, token: string) {
  const { title, amount, description, category, due_date, agent_id } = params as CreateRfpParams;
  
  // Validate required parameters
  if (!title || !amount || !agent_id) {
    throw new Error('Missing required fields: title, amount, agent_id');
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  // Call A2A Hub for policy enforcement
  const policyResult = await callA2AHub('procurement.create_rfp', agent_id, {
    title,
    amount,
    description,
    category,
    due_date
  }, token);
  
  if (!policyResult.success) {
    throw new Error(`Policy enforcement failed: ${policyResult.error}`);
  }
  
  // Create RFP
  const rfpId = `rfp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const rfp: RfpData = {
    rfp_id: rfpId,
    title,
    amount,
    status: 'draft',
    created_by: agent_id,
    created_at: new Date().toISOString(),
    description,
    category,
    due_date
  };
  
  rfpStore.set(rfpId, rfp);
  
  return {
    rfp_id: rfpId,
    status: 'created',
    message: 'RFP created successfully',
    timestamp: new Date().toISOString(),
    rfp: rfp
  };
}

// Handle Submit RFP (minimal)
async function handleSubmitRfp(params: any, token: string) {
  const { rfp_id, agent_id } = params;
  
  if (!rfp_id) {
    throw new Error('RFP ID is required');
  }
  
  const rfp = rfpStore.get(rfp_id);
  if (!rfp) {
    throw new Error(`RFP not found: ${rfp_id}`);
  }
  
  if (rfp.status !== 'draft') {
    throw new Error(`RFP ${rfp_id} is not in draft status`);
  }
  
  // Call A2A Hub for policy enforcement
  const hubResponse = await callA2AHub('submit_rfp', agent_id || 'unknown', {
    rfp_id,
    amount: rfp.amount
  }, token);
  
  if (!hubResponse.success) {
    throw new Error(`Policy check failed: ${hubResponse.error}`);
  }
  
  // Update RFP status
  rfp.status = 'submitted';
  rfpStore.set(rfp_id, rfp);
  
  console.log(`Submitted RFP: ${rfp_id} by ${agent_id}`);
  
  return {
    rfp_id,
    status: 'submitted',
    message: 'RFP submitted successfully'
  };
}

// Handle Track RFP (minimal)
async function handleTrackRfp(params: any, token: string) {
  const { rfp_id } = params;
  
  if (!rfp_id) {
    throw new Error('RFP ID is required');
  }
  
  const rfp = rfpStore.get(rfp_id);
  if (!rfp) {
    throw new Error(`RFP not found: ${rfp_id}`);
  }
  
  return {
    rfp_id,
    status: rfp.status,
    title: rfp.title,
    amount: rfp.amount,
    created_at: rfp.created_at
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`Procurement Agent running on port ${PORT}`);
  console.log(`A2A Hub URL: ${A2A_HUB_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Agent card: http://localhost:${PORT}/a2a/agent-card`);
});

export default app; 