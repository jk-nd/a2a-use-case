const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function deployPaymentProtocol() {
  console.log('🚀 Deploying Payment Protocol (OrderCommitment)...\n');

  try {
    // Get token for buyer
    console.log('🔑 Getting token for buyer...');
    const { execSync } = require('child_process');
    const getTokenPath = path.join(__dirname, 'get-token.js');
    execSync(`node ${getTokenPath} buyer`, { stdio: 'inherit' });
    
    // Read the token
    const token = fs.readFileSync('test-token.txt', 'utf8').trim();
    console.log('✅ Token loaded successfully');

    // Read the OrderCommitment protocol file
    const protocolPath = path.join(__dirname, '../src/main/npl-1.0.0/payment_workflow/order_commitment.npl');
    const nplCode = fs.readFileSync(protocolPath, 'utf8');
    console.log('✅ OrderCommitment protocol file loaded');

    // Deploy the protocol
    console.log('📤 Deploying protocol to NPL engine...');
    const deployResponse = await axios.post('http://localhost:8000/a2a/deploy', {
      package: 'payment_workflow',
      protocol: 'OrderCommitment',
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

    console.log('\n🎉 Payment Protocol deployment completed successfully!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the deployment if this script is executed directly
if (require.main === module) {
  deployPaymentProtocol();
}

module.exports = { deployPaymentProtocol }; 