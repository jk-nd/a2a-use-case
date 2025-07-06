const axios = require('axios');

// Example: Quality Assurance Workflow
const qualityAssuranceRequest = {
  businessName: "Quality Assurance",
  workflowDescription: "Quality inspection workflow where buyer requests inspection, supplier performs it, and buyer approves or rejects",
  parties: ["buyer", "supplier"],
  states: ["requested", "in-progress", "completed", "approved", "rejected"],
  actions: [
    {
      name: "Request Inspection",
      description: "Buyer requests a quality inspection",
      party: "buyer",
      fromState: "requested",
      toState: "in-progress",
      parameters: [
        {
          name: "inspectionType",
          type: "Text",
          description: "Type of inspection required"
        },
        {
          name: "deadline",
          type: "DateTime",
          description: "Deadline for inspection completion"
        }
      ]
    },
    {
      name: "Perform Inspection",
      description: "Supplier performs the quality inspection",
      party: "supplier",
      fromState: "in-progress",
      toState: "completed",
      parameters: [
        {
          name: "inspectionResults",
          type: "Text",
          description: "Detailed inspection results"
        },
        {
          name: "completionDate",
          type: "DateTime",
          description: "Date when inspection was completed"
        }
      ]
    },
    {
      name: "Approve Inspection",
      description: "Buyer approves the inspection results",
      party: "buyer",
      fromState: "completed",
      toState: "approved"
    },
    {
      name: "Reject Inspection",
      description: "Buyer rejects the inspection results",
      party: "buyer",
      fromState: "completed",
      toState: "rejected",
      parameters: [
        {
          name: "rejectionReason",
          type: "Text",
          description: "Reason for rejection"
        }
      ]
    },
    {
      name: "Resubmit Inspection",
      description: "Supplier resubmits inspection after rejection",
      party: "supplier",
      fromState: "rejected",
      toState: "in-progress",
      parameters: [
        {
          name: "updatedResults",
          type: "Text",
          description: "Updated inspection results"
        }
      ]
    }
  ],
  businessRules: [
    "Inspection must be completed before deadline",
    "Buyer can only approve or reject completed inspections",
    "Supplier can resubmit rejected inspections",
    "All inspection results must be documented"
  ],
  customRequirements: "Include audit trail for all inspection activities"
};

async function testProtocolGeneration() {
  try {
    console.log('🚀 Testing NPL Protocol Generation Service\n');

    // Step 1: Validate Requirements
    console.log('📋 Step 1: Validating requirements...');
    const validationResponse = await axios.post('http://localhost:3000/validate-requirements', qualityAssuranceRequest);
    console.log('✅ Validation result:', validationResponse.data.valid);
    if (validationResponse.data.suggestions.length > 0) {
      console.log('💡 Suggestions:', validationResponse.data.suggestions);
    }

    // Step 2: Generate Protocol
    console.log('\n🔧 Step 2: Generating NPL protocol...');
    const generationResponse = await axios.post('http://localhost:3000/generate-protocol', qualityAssuranceRequest);
    
    if (generationResponse.data.success) {
      console.log('✅ Protocol generated successfully!');
      console.log('📊 Metadata:', generationResponse.data.metadata);
      
      // Display generated NPL code
      console.log('\n📝 Generated NPL Code:');
      console.log('```npl');
      console.log(generationResponse.data.nplCode);
      console.log('```');
      
      // Display business analysis
      console.log('\n📊 Business Analysis:');
      console.log('Workflow Description:');
      console.log(generationResponse.data.businessAnalysis.workflowDescription);
      
      console.log('\nUML Diagram:');
      console.log(generationResponse.data.businessAnalysis.umlDiagram);
      
      // Display API documentation
      console.log('\n🔌 API Documentation:');
      console.log('Available Methods:');
      generationResponse.data.apiDocumentation.methods.forEach(method => {
        console.log(`- ${method.name}: ${method.description}`);
        if (method.parameters.length > 0) {
          method.parameters.forEach(param => {
            console.log(`  - ${param.name} (${param.type}): ${param.description}`);
          });
        }
      });
      
      // Step 3: Deploy Protocol (optional)
      console.log('\n🚀 Step 3: Deploying protocol to A2A system...');
      const deploymentResponse = await axios.post('http://localhost:3000/deploy-protocol', {
        nplCode: generationResponse.data.nplCode,
        packageName: generationResponse.data.metadata.packageName,
        protocolName: generationResponse.data.metadata.protocolName
      });
      
      if (deploymentResponse.data.success) {
        console.log('✅ Protocol deployed successfully!');
        console.log('Deployment response:', deploymentResponse.data.deployment);
      } else {
        console.log('❌ Deployment failed:', deploymentResponse.data.error);
      }
      
    } else {
      console.log('❌ Protocol generation failed:', generationResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Example: Get available templates
async function getTemplates() {
  try {
    console.log('📋 Getting available templates...');
    const response = await axios.get('http://localhost:3000/templates');
    console.log('Available templates:');
    response.data.templates.forEach(template => {
      console.log(`- ${template.name}: ${template.description} (${template.complexity})`);
    });
  } catch (error) {
    console.error('Failed to get templates:', error.message);
  }
}

// Run tests
async function runTests() {
  await getTemplates();
  console.log('\n' + '='.repeat(50) + '\n');
  await testProtocolGeneration();
}

if (require.main === module) {
  runTests();
}

module.exports = { testProtocolGeneration, getTemplates }; 