const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const A2A_SERVER_URL = 'http://localhost:8000';
const TOKEN_FILE = 'tests/test-token.txt';

async function deployRfpProtocol() {
  console.log('🚀 Deploying RFP Protocol...\n');

  try {
    // Read the token
    const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    console.log('✅ Token loaded successfully');

    // Read the RFP protocol file
    const rfpProtocolPath = path.join(__dirname, 'src/main/npl-1.0.0/rfp_workflow/rfp_protocol.npl');
    const nplCode = fs.readFileSync(rfpProtocolPath, 'utf8');
    console.log('✅ RFP protocol file loaded');

    // Deploy the protocol
    console.log('📤 Deploying protocol to NPL engine...');
    const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
      package: 'rfp_workflow',
      protocol: 'RfpWorkflow',
      nplCode: nplCode,
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Protocol deployed successfully!');
    console.log('📋 Deployment response:', deployResponse.data);

    // Refresh A2A methods
    console.log('\n🔄 Refreshing A2A methods...');
    const refreshResponse = await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ A2A methods refreshed successfully!');
    console.log('📋 Refresh response:', refreshResponse.data);

    // List deployed protocols
    console.log('\n📋 Listing deployed protocols...');
    const protocolsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/protocols`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Protocols listed successfully!');
    console.log('📋 Available protocols:', protocolsResponse.data);

    // Get available skills
    console.log('\n🎯 Getting available skills...');
    const skillsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/skills`);

    console.log('✅ Skills retrieved successfully!');
    console.log('📋 Available skills:', skillsResponse.data);

    console.log('\n🎉 RFP Protocol deployment completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Protocol: rfp_workflow.RfpWorkflow');
    console.log('- Methods: submitForApproval, approveBudget, rejectBudget, activateRfp, etc.');
    console.log('- Status: Ready for testing');

  } catch (error) {
    console.error('❌ Deployment failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the deployment
deployRfpProtocol(); 