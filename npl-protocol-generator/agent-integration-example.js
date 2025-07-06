const axios = require('axios');

/**
 * Example: How agents can use the NPL Protocol Generator Service
 * 
 * This demonstrates how buyer and seller agents can:
 * 1. Define their business requirements
 * 2. Generate a custom NPL protocol
 * 3. Deploy it to the A2A system
 * 4. Execute the workflow
 */

class AgentProtocolGenerator {
  constructor(agentName, generatorServiceUrl = 'http://localhost:3000') {
    this.agentName = agentName;
    this.generatorServiceUrl = generatorServiceUrl;
  }

  /**
   * Define a custom workflow based on business requirements
   */
  async defineCustomWorkflow(requirements) {
    console.log(`🤖 ${this.agentName}: Defining custom workflow...`);
    
    try {
      // Validate requirements first
      const validation = await this.validateRequirements(requirements);
      if (!validation.valid) {
        throw new Error(`Requirements validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate the protocol
      const generation = await this.generateProtocol(requirements);
      if (!generation.success) {
        throw new Error(`Protocol generation failed: ${generation.error}`);
      }

      // Deploy to A2A system
      const deployment = await this.deployProtocol(generation);
      if (!deployment.success) {
        throw new Error(`Protocol deployment failed: ${deployment.error}`);
      }

      return {
        success: true,
        protocolId: deployment.deployment.protocolId,
        methods: generation.apiDocumentation.methods,
        metadata: generation.metadata
      };

    } catch (error) {
      console.error(`❌ ${this.agentName}: Workflow definition failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async validateRequirements(requirements) {
    const response = await axios.post(`${this.generatorServiceUrl}/validate-requirements`, requirements);
    return response.data;
  }

  async generateProtocol(requirements) {
    const response = await axios.post(`${this.generatorServiceUrl}/generate-protocol`, requirements);
    return response.data;
  }

  async deployProtocol(generation) {
    const response = await axios.post(`${this.generatorServiceUrl}/deploy-protocol`, {
      nplCode: generation.nplCode,
      packageName: generation.metadata.packageName,
      protocolName: generation.metadata.protocolName
    });
    return response.data;
  }

  /**
   * Execute a workflow step using the generated protocol
   */
  async executeWorkflowStep(protocolId, methodName, parameters = {}) {
    console.log(`🤖 ${this.agentName}: Executing ${methodName}...`);
    
    try {
      const response = await axios.post('http://localhost:8000/a2a/request', {
        jsonrpc: '2.0',
        id: `req-${Date.now()}`,
        method: methodName,
        params: {
          id: protocolId,
          ...parameters
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ ${this.agentName}: Workflow execution failed:`, error.message);
      return { error: error.message };
    }
  }
}

// Example: Buyer and Seller agents creating a custom workflow
async function demonstrateAgentIntegration() {
  console.log('🚀 Agent Integration with NPL Protocol Generator\n');

  // Initialize agents
  const buyerAgent = new AgentProtocolGenerator('Buyer Agent');
  const sellerAgent = new AgentProtocolGenerator('Seller Agent');

  // Define a custom "Product Development" workflow
  const productDevelopmentRequirements = {
    businessName: "Product Development",
    workflowDescription: "Collaborative product development workflow where buyer defines requirements, seller develops prototype, and both parties review and approve",
    parties: ["buyer", "seller"],
    states: ["requirements-gathering", "prototype-development", "review", "approved", "rejected", "completed"],
    actions: [
      {
        name: "Define Requirements",
        description: "Buyer defines product requirements and specifications",
        party: "buyer",
        fromState: "requirements-gathering",
        toState: "prototype-development",
        parameters: [
          {
            name: "requirements",
            type: "Text",
            description: "Detailed product requirements"
          },
          {
            name: "deadline",
            type: "DateTime",
            description: "Development deadline"
          },
          {
            name: "budget",
            type: "Number",
            description: "Development budget"
          }
        ]
      },
      {
        name: "Develop Prototype",
        description: "Seller develops the product prototype",
        party: "seller",
        fromState: "prototype-development",
        toState: "review",
        parameters: [
          {
            name: "prototypeUrl",
            type: "Text",
            description: "URL to prototype or demo"
          },
          {
            name: "developmentNotes",
            type: "Text",
            description: "Development notes and technical details"
          }
        ]
      },
      {
        name: "Review Prototype",
        description: "Buyer reviews the prototype and provides feedback",
        party: "buyer",
        fromState: "review",
        toState: "approved",
        parameters: [
          {
            name: "feedback",
            type: "Text",
            description: "Review feedback and comments"
          }
        ]
      },
      {
        name: "Reject Prototype",
        description: "Buyer rejects the prototype and requests changes",
        party: "buyer",
        fromState: "review",
        toState: "rejected",
        parameters: [
          {
            name: "rejectionReason",
            type: "Text",
            description: "Reason for rejection"
          },
          {
            name: "requestedChanges",
            type: "Text",
            description: "Requested changes and improvements"
          }
        ]
      },
      {
        name: "Revise Prototype",
        description: "Seller revises the prototype based on feedback",
        party: "seller",
        fromState: "rejected",
        toState: "review",
        parameters: [
          {
            name: "revisedPrototypeUrl",
            type: "Text",
            description: "URL to revised prototype"
          },
          {
            name: "changesMade",
            type: "Text",
            description: "Description of changes made"
          }
        ]
      },
      {
        name: "Complete Project",
        description: "Both parties agree to complete the project",
        party: "buyer",
        fromState: "approved",
        toState: "completed",
        parameters: [
          {
            name: "completionNotes",
            type: "Text",
            description: "Final completion notes"
          }
        ]
      }
    ],
    businessRules: [
      "Requirements must be clearly defined before development starts",
      "Prototype must be delivered before deadline",
      "Buyer can only approve or reject completed prototypes",
      "Seller can revise rejected prototypes",
      "Project completion requires mutual agreement"
    ],
    customRequirements: "Include version control and change tracking for all deliverables"
  };

  console.log('📋 Step 1: Buyer Agent defining custom workflow...');
  const buyerResult = await buyerAgent.defineCustomWorkflow(productDevelopmentRequirements);
  
  if (!buyerResult.success) {
    console.log('❌ Workflow definition failed:', buyerResult.error);
    return;
  }

  console.log('✅ Custom workflow created successfully!');
  console.log('📊 Protocol ID:', buyerResult.protocolId);
  console.log('🔌 Available Methods:', buyerResult.methods.map(m => m.name).join(', '));

  // Execute the workflow
  console.log('\n🔄 Step 2: Executing the custom workflow...');

  // Buyer defines requirements
  console.log('\n📝 Buyer defining requirements...');
  const defineRequirementsResult = await buyerAgent.executeWorkflowStep(
    buyerResult.protocolId,
    'definerequirements',
    {
      requirements: "Create a mobile app with user authentication, dashboard, and reporting features",
      deadline: "2025-08-01T00:00:00Z",
      budget: 50000
    }
  );
  console.log('✅ Requirements defined:', defineRequirementsResult);

  // Seller develops prototype
  console.log('\n🔧 Seller developing prototype...');
  const developPrototypeResult = await sellerAgent.executeWorkflowStep(
    buyerResult.protocolId,
    'developprototype',
    {
      prototypeUrl: "https://demo.example.com/prototype",
      developmentNotes: "Implemented core features with React Native, Firebase auth, and basic dashboard"
    }
  );
  console.log('✅ Prototype developed:', developPrototypeResult);

  // Buyer reviews prototype
  console.log('\n👀 Buyer reviewing prototype...');
  const reviewPrototypeResult = await buyerAgent.executeWorkflowStep(
    buyerResult.protocolId,
    'reviewprototype',
    {
      feedback: "Great work! The authentication and dashboard look good. Need some improvements on the reporting features."
    }
  );
  console.log('✅ Prototype reviewed:', reviewPrototypeResult);

  // Complete the project
  console.log('\n🎉 Completing project...');
  const completeProjectResult = await buyerAgent.executeWorkflowStep(
    buyerResult.protocolId,
    'completeproject',
    {
      completionNotes: "Project completed successfully. All requirements met and prototype approved."
    }
  );
  console.log('✅ Project completed:', completeProjectResult);

  console.log('\n🎉 Custom workflow executed successfully!');
  console.log('📊 Final Status: Project completed with custom protocol');
}

// Example: Get available templates
async function showAvailableTemplates() {
  try {
    console.log('📋 Available Protocol Templates:');
    const response = await axios.get('http://localhost:3000/templates');
    
    response.data.templates.forEach(template => {
      console.log(`\n📦 ${template.name} (${template.complexity})`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Parties: ${template.parties.join(', ')}`);
      console.log(`   States: ${template.states.join(' → ')}`);
    });
  } catch (error) {
    console.error('Failed to get templates:', error.message);
  }
}

// Run the demonstration
async function runDemonstration() {
  await showAvailableTemplates();
  console.log('\n' + '='.repeat(60) + '\n');
  await demonstrateAgentIntegration();
}

if (require.main === module) {
  runDemonstration();
}

module.exports = { AgentProtocolGenerator, demonstrateAgentIntegration }; 