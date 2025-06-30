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
    id: 'finance.approve_budget',
    name: 'Approve Budget',
    description: 'Approve budget allocation for Request for Proposal with financial validation',
    tags: ['finance', 'budget', 'approval', 'rfp'],
    examples: [
      'Approve budget for software development RFP',
      'Approve IT budget allocation of $50,000'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  },
  {
    id: 'finance.check_budget_availability',
    name: 'Check Budget Availability',
    description: 'Check if sufficient budget is available for a specific amount and budget code',
    tags: ['finance', 'budget', 'validation', 'availability'],
    examples: [
      'Check IT budget availability for $50,000',
      'Verify budget code IT-2024-001 has sufficient funds'
    ],
    inputModes: ['application/json'],
    outputModes: ['application/json']
  },
  {
    id: 'finance.get_budget_status',
    name: 'Get Budget Status',
    description: 'Get current budget status, allocations, and remaining funds for a budget code',
    tags: ['finance', 'budget', 'status', 'reporting'],
    examples: [
      'Get IT budget status for 2024',
      'Check remaining budget for IT-2024-001'
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
      description: 'OAuth 2.0 authentication for secure financial operations',
      required: false
    }
  ]
};

// Create security scheme
const securityScheme: HTTPAuthSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Bearer token authentication for financial operations'
};

// Create agent provider
const agentProvider: AgentProvider = {
  organization: 'A2A Demo Organization',
  url: 'https://github.com/your-org/a2a-demo'
};

// Create agent card with full Google A2A structure
const agentCard: AgentCard = {
  name: 'Finance Agent',
  description: 'Enterprise finance agent for budget approval, financial validation, and budget management with policy enforcement',
  url: `http://localhost:${PORT}/a2a`,
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
    service: 'finance-agent',
    timestamp: new Date().toISOString(),
    budget_approvals_count: budgetApprovals.size,
    budget_data_count: budgetData.size
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
    
    console.log('Finance Agent received request:', {
      id: request.id,
      method: request.method,
      params: request.params
    });
    
    let result: any;
    
    switch (request.method) {
      case 'finance.approve_budget':
        result = await handleApproveBudget(request.params, token);
        break;
      case 'finance.check_budget_availability':
        result = await handleCheckBudgetAvailability(request.params, token);
        break;
      case 'finance.get_budget_status':
        result = await handleGetBudgetStatus(request.params, token);
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

// Handle Approve Budget
async function handleApproveBudget(params: any, token: string) {
  const { rfp_id, amount, budget_code, agent_id, comments } = params;
  
  if (!rfp_id || !amount || !budget_code) {
    throw new Error('Missing required fields: rfp_id, amount, budget_code');
  }
  
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  // Check if budget is available
  const budget = budgetData.get(budget_code);
  if (!budget) {
    throw new Error(`Budget code not found: ${budget_code}`);
  }
  
  if (budget.remaining_budget < amount) {
    throw new Error(`Insufficient budget. Available: ${budget.remaining_budget}, Requested: ${amount}`);
  }
  
  // Call A2A Hub for policy enforcement
  const hubResponse = await callA2AHub('finance.approve_budget', agent_id || 'unknown', {
    rfp_id,
    amount,
    budget_code
  }, token);
  
  if (!hubResponse.success) {
    throw new Error(`Policy check failed: ${hubResponse.error}`);
  }
  
  // Create budget approval
  const approval: BudgetApproval = {
    rfp_id,
    amount,
    budget_code,
    approved: true,
    approved_by: agent_id || 'unknown',
    approved_at: new Date().toISOString(),
    comments
  };
  
  // Store approval
  budgetApprovals.set(rfp_id, approval);
  
  // Update budget allocation
  budget.allocated_budget += amount;
  budget.remaining_budget -= amount;
  budgetData.set(budget_code, budget);
  
  console.log(`Budget approved for RFP: ${rfp_id} by ${agent_id}`);
  
  return {
    rfp_id,
    approved: true,
    amount,
    budget_code,
    remaining_budget: budget.remaining_budget,
    message: 'Budget approved successfully'
  };
}

// Handle Check Budget Availability
async function handleCheckBudgetAvailability(params: any, token: string) {
  const { budget_code, amount } = params;
  
  if (!budget_code || !amount) {
    throw new Error('Missing required fields: budget_code, amount');
  }
  
  const budget = budgetData.get(budget_code);
  if (!budget) {
    throw new Error(`Budget code not found: ${budget_code}`);
  }
  
  const available = budget.remaining_budget >= amount;
  
  return {
    budget_code,
    requested_amount: amount,
    total_budget: budget.total_budget,
    allocated_budget: budget.allocated_budget,
    remaining_budget: budget.remaining_budget,
    available: available,
    message: available ? 'Budget is available' : 'Insufficient budget'
  };
}

// Handle Get Budget Status
async function handleGetBudgetStatus(params: any, token: string) {
  const { budget_code } = params;
  
  if (!budget_code) {
    throw new Error('Budget code is required');
  }
  
  const budget = budgetData.get(budget_code);
  if (!budget) {
    throw new Error(`Budget code not found: ${budget_code}`);
  }
  
  return {
    budget_code,
    total_budget: budget.total_budget,
    allocated_budget: budget.allocated_budget,
    remaining_budget: budget.remaining_budget,
    fiscal_year: budget.fiscal_year,
    utilization_percentage: Math.round((budget.allocated_budget / budget.total_budget) * 100)
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`Finance Agent running on port ${PORT}`);
  console.log(`A2A Hub URL: ${A2A_HUB_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Agent card: http://localhost:${PORT}/a2a/agent-card`);
});

export default app; 