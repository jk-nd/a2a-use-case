import { OpenAI } from 'openai';

interface ProtocolGenerationRequest {
  businessName: string;
  workflowDescription: string;
  parties: string[];
  states: string[];
  actions: Array<{
    name: string;
    description: string;
    party: string;
    fromState: string;
    toState: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
    }>;
  }>;
  businessRules?: string[];
  customRequirements?: string;
}

export async function generateAPIDocumentation(
  request: ProtocolGenerationRequest,
  nplCode: string,
  openai: OpenAI
) {
  
  const prompt = `
Generate comprehensive API documentation for the following NPL protocol:

Business Context:
- Business Name: ${request.businessName}
- Description: ${request.workflowDescription}
- Parties: ${request.parties.join(', ')}
- States: ${request.states.join(', ')}
- Actions: ${JSON.stringify(request.actions, null, 2)}

NPL Code:
${nplCode}

Please provide:

1. A2A METHODS: List all available A2A methods that will be generated from this protocol
2. PARAMETERS: For each method, list the required parameters with types and descriptions
3. DEPLOYMENT INSTRUCTIONS: Step-by-step instructions for deploying this protocol

Format the response as JSON with these fields:
- methods: array of objects with name, description, parameters fields
- deploymentInstructions: string with step-by-step deployment guide

For each method, include:
- name: The method name (e.g., "createOrder", "commitToPay")
- description: What the method does
- parameters: array of objects with name, type, required, description fields
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an API documentation expert. Generate clear, comprehensive API documentation for NPL protocols."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('Failed to generate API documentation');
    }

    // Try to parse JSON response
    try {
      const docs = JSON.parse(response);
      return {
        methods: docs.methods || generateBasicMethods(request),
        deploymentInstructions: docs.deploymentInstructions || generateBasicDeploymentInstructions(request)
      };
    } catch (parseError) {
      // Fallback: generate basic documentation from request data
      return {
        methods: generateBasicMethods(request),
        deploymentInstructions: generateBasicDeploymentInstructions(request)
      };
    }
    
  } catch (error) {
    console.error('Error generating API documentation:', error);
    // Return basic documentation as fallback
    return {
      methods: generateBasicMethods(request),
      deploymentInstructions: generateBasicDeploymentInstructions(request)
    };
  }
}

function generateBasicMethods(request: ProtocolGenerationRequest) {
  const packageName = request.businessName.toLowerCase().replace(/\s+/g, '_');
  const protocolName = request.businessName.replace(/\s+/g, '');
  
  const methods = [
    {
      name: `create${protocolName}`,
      description: `Create a new ${request.businessName} instance`,
      parameters: [
        {
          name: 'orderDetails',
          type: 'OrderDetails',
          required: true,
          description: 'Details of the order to be created'
        }
      ]
    }
  ];

  // Add action methods
  request.actions.forEach(action => {
    const methodName = action.name.toLowerCase().replace(/\s+/g, '');
    const method = {
      name: methodName,
      description: action.description,
      parameters: [
        {
          name: 'id',
          type: 'Text',
          required: true,
          description: 'Protocol instance ID'
        }
      ]
    };

    // Add custom parameters if specified
    if (action.parameters) {
      action.parameters.forEach(param => {
        method.parameters.push({
          name: param.name,
          type: param.type,
          required: true,
          description: param.description
        });
      });
    }

    methods.push(method);
  });

  // Add query methods
  methods.push(
    {
      name: 'getStatus',
      description: 'Get current status of the protocol instance',
      parameters: [
        {
          name: 'id',
          type: 'Text',
          required: true,
          description: 'Protocol instance ID'
        }
      ]
    },
    {
      name: 'listMyProtocols',
      description: 'List all protocol instances for the current user',
      parameters: []
    }
  );

  return methods;
}

function generateBasicDeploymentInstructions(request: ProtocolGenerationRequest): string {
  const packageName = request.businessName.toLowerCase().replace(/\s+/g, '_');
  const protocolName = request.businessName.replace(/\s+/g, '');
  
  return `
# Deployment Instructions for ${request.businessName}

## Step 1: Deploy Protocol to A2A System
\`\`\`bash
curl -X POST http://localhost:8000/a2a/deploy \\
  -H "Content-Type: application/json" \\
  -d '{
    "package": "${packageName}",
    "protocol": "${protocolName}",
    "nplCode": "<generated_npl_code>"
  }'
\`\`\`

## Step 2: Verify Deployment
\`\`\`bash
curl http://localhost:8000/a2a/skills
\`\`\`

## Step 3: Instantiate Protocol
\`\`\`bash
curl -X POST http://localhost:8000/a2a/instantiate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <jwt_token>" \\
  -d '{
    "package": "${packageName}",
    "protocol": "${protocolName}",
    "parameters": {
      "orderDetails": {
        "totalAmount": 1000,
        "description": "Sample order"
      }
    }
  }'
\`\`\`

## Step 4: Execute Workflow
Use the generated A2A methods to execute the workflow steps.

## Available Methods:
${generateBasicMethods(request).map(method => 
  `- \`${method.name}\`: ${method.description}`
).join('\n')}
`.trim();
} 