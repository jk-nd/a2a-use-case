const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function deployRfpProtocol() {
  console.log('🚀 Deploying RFP Protocol...\n');

  try {
    // Get token for buyer
    console.log('🔑 Getting token for buyer...');
    const { execSync } = require('child_process');
    execSync('node get-token.js buyer', { stdio: 'inherit' });
    
    // Read the token
    const token = fs.readFileSync('test-token.txt', 'utf8').trim();
    console.log('✅ Token loaded successfully');

    // Read the RFP protocol file
    const rfpProtocolPath = path.join(__dirname, '../src/main/npl-1.0.0/rfp_workflow/rfp_protocol.npl');
    const nplCode = fs.readFileSync(rfpProtocolPath, 'utf8');
    console.log('✅ RFP protocol file loaded');

    // Deploy the protocol
    console.log('📤 Deploying protocol to NPL engine...');
    const deployResponse = await axios.post('http://localhost:8000/a2a/deploy', {
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
    const refreshResponse = await axios.post('http://localhost:8000/a2a/refresh', {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ A2A methods refreshed successfully!');
    console.log('📋 Refresh response:', refreshResponse.data);

    console.log('\n🎉 RFP Protocol deployment completed successfully!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the deployment
deployRfpProtocol(); 