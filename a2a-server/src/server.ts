import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
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

// Verify JWT token middleware
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // TODO: Implement proper JWT verification with Keycloak
    // For now, we'll just pass the token through
    (req as any).token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

// Call NPL engine
async function callNplEngine(action: string, agentId: string, context: any, token: string) {
  try {
    const response = await axios.post(
      `${NPL_ENGINE_URL}/npl/evaluate`,
      {
        action,
        agent_id: agentId,
        context
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error calling NPL engine:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

// Create agent capabilities
const agentCapabilities: AgentCapabilities = {
  // Add capabilities as needed
};

// Create agent skills
const agentSkills: AgentSkill[] = [
  {
    id: 'policy_enforcement',
    name: 'Policy Enforcement',
    description: 'Enforce NPL-based policies for agent interactions',
    examples: ['Check if agent can perform action', 'Validate workflow state'],
    tags: ['policy', 'authorization', 'security']
  },
  {
    id: 'workflow_management',
    name: 'Workflow Management',
    description: 'Manage multi-agent workflow states and transitions',
    examples: ['Submit RFP', 'Approve workflow step', 'Generate contract'],
    tags: ['workflow', 'state-management', 'rfp']
  }
];

// Create agent card
const agentCard: AgentCard = {
  name: 'NPL-Integrated-A2A-Server',
  description: 'A2A server with NPL policy enforcement for agent workflows',
  version: '1.0.0',
  url: `http://localhost:${PORT}/a2a`,
  capabilities: agentCapabilities,
  skills: agentSkills,
  defaultInputModes: ['text', 'json'],
  defaultOutputModes: ['text', 'json']
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'a2a-npl-server',
    timestamp: new Date().toISOString()
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
    
    console.log('Received A2A request:', {
      id: request.id,
      method: request.method,
      agentId: request.params?.agent_id
    });
    
    // Convert A2A request to NPL request
    const nplRequest = {
      action: request.method,
      agent_id: request.params?.agent_id || 'unknown',
      context: request.params || {}
    };
    
    // Call NPL engine
    const nplResponse = await callNplEngine(
      nplRequest.action,
      nplRequest.agent_id,
      nplRequest.context,
      token
    );
    
    if (nplResponse.success) {
      const response: JSONRPCSuccessResponse = {
        jsonrpc: '2.0',
        id: request.id || null,
        result: nplResponse.data || {}
      };
      res.json(response);
    } else {
      const response: JSONRPCErrorResponse = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32000,
          message: nplResponse.error || 'Unknown error'
        }
      };
      res.json(response);
    }
    
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

// Start server
app.listen(PORT, () => {
  console.log(`A2A-NPL Server running on port ${PORT}`);
  console.log(`NPL Engine URL: ${NPL_ENGINE_URL}`);
  console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Agent card: http://localhost:${PORT}/a2a/agent-card`);
});

export default app; 