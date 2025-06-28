import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Import types
import { 
  AgentCard, 
  AgentSkill, 
  JSONRPCRequest, 
  JSONRPCErrorResponse,
  JSONRPCSuccessResponse,
  RfpData
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

// Create agent skills (minimal)
const agentSkills: AgentSkill[] = [
  {
    id: 'create_rfp',
    name: 'Create RFP',
    description: 'Create a new Request for Proposal',
    examples: ['Create RFP for software development'],
    tags: ['rfp', 'procurement']
  },
  {
    id: 'submit_rfp',
    name: 'Submit RFP',
    description: 'Submit an RFP for approval workflow',
    examples: ['Submit RFP for finance approval'],
    tags: ['rfp', 'workflow']
  },
  {
    id: 'track_rfp',
    name: 'Track RFP',
    description: 'Track the status of an RFP',
    examples: ['Check RFP approval status'],
    tags: ['rfp', 'status']
  }
];

// Create agent card
const agentCard: AgentCard = {
  name: 'Procurement Agent',
  description: 'Minimal procurement agent for RFP workflow',
  version: '1.0.0',
  url: `http://localhost:${PORT}/a2a`,
  skills: agentSkills,
  defaultInputModes: ['json'],
  defaultOutputModes: ['json']
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
      case 'create_rfp':
        result = await handleCreateRfp(request.params, token);
        break;
      case 'submit_rfp':
        result = await handleSubmitRfp(request.params, token);
        break;
      case 'track_rfp':
        result = await handleTrackRfp(request.params, token);
        break;
      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
    
    const response: JSONRPCSuccessResponse = {
      jsonrpc: '2.0',
      id: request.id || null,
      result: result
    };
    res.json(response);
    
  } catch (error: any) {
    console.error('Error handling A2A request:', error);
    
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

// Handle Create RFP (minimal)
async function handleCreateRfp(params: any, token: string) {
  const { title, amount, agent_id } = params;
  
  // Basic validation
  if (!title || !amount) {
    throw new Error('Missing required fields: title, amount');
  }
  
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  // Generate simple RFP ID
  const rfp_id = `RFP-${Date.now()}`;
  
  // Create minimal RFP data
  const rfpData: RfpData = {
    rfp_id,
    title,
    amount,
    status: 'draft',
    created_by: agent_id || 'unknown',
    created_at: new Date().toISOString()
  };
  
  // Store RFP
  rfpStore.set(rfp_id, rfpData);
  
  console.log(`Created RFP: ${rfp_id} by ${agent_id}`);
  
  return {
    rfp_id,
    status: 'draft',
    message: 'RFP created successfully'
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