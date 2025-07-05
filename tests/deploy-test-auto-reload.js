const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function deployTestAutoReload() {
  console.log('🚀 Deploying Test Auto-Reload Protocol...\n');

  try {
    // Read the technical user token
    console.log('🔑 Reading technical user token...');
    const token = fs.readFileSync('.technical-user-token', 'utf8').trim();
    console.log('✅ Technical user token loaded successfully');

    // Read the TestProtocol file
    const protocolPath = path.join(__dirname, '../src/main/npl-1.0.0/test_auto_reload/test_protocol.npl');
    const nplCode = fs.readFileSync(protocolPath, 'utf8');
    console.log('✅ TestProtocol file loaded');

    // Deploy the protocol
    console.log('📤 Deploying protocol to A2A server...');
    const response = await axios.post('http://localhost:8000/a2a/deploy', {
      package: 'test_auto_reload',
      protocol: 'TestProtocol',
      nplCode: nplCode,
      token: token
    });

    console.log('✅ Deployment successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

    // Wait a moment for the agent skills to reload
    console.log('⏳ Waiting for agent skills to reload...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if the new protocol is available in skills
    console.log('🔍 Checking if protocol is available in skills...');
    const skillsResponse = await axios.get('http://localhost:8000/a2a/skills');
    const protocols = skillsResponse.data.protocols;
    
    const newProtocol = protocols.find(p => p.package === 'test_auto_reload' && p.protocol === 'TestProtocol');
    
    if (newProtocol) {
      console.log('✅ SUCCESS: Test protocol is automatically available in skills!');
      console.log('📋 Available protocols:', protocols.map(p => `${p.package}.${p.protocol}`));
    } else {
      console.log('❌ FAILED: Test protocol is not available in skills');
      console.log('📋 Available protocols:', protocols.map(p => `${p.package}.${p.protocol}`));
    }

  } catch (error) {
    console.error('❌ Deployment failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

deployTestAutoReload(); 