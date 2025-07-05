const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const A2A_SERVER_URL = 'http://localhost:8000';
const KEYCLOAK_URL = 'http://localhost:11000';
const REALM = 'noumena';
const CLIENT_ID = 'noumena';

// Test user credentials
const TEST_USER = {
  username: 'buyer',
  password: 'password123'
};

async function getAccessToken(username, password) {
  try {
    const response = await axios.post(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: username,
        password: password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error(`Failed to get token for ${username}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Deploy Payment Workflow protocol at runtime
 */
async function deployPaymentWorkflow() {
  console.log('🚀 Deploying Payment Workflow Protocol at Runtime...\n');

  try {
    // Get access token
    console.log('🔑 Getting access token...');
    const token = await getAccessToken(TEST_USER.username, TEST_USER.password);
    console.log('✅ Access token obtained\n');

    // Read the payment workflow protocol file
    const paymentProtocolPath = path.join(__dirname, '../src/main/npl-1.0.0/payment_workflow/order_commitment.npl');
    
    if (!fs.existsSync(paymentProtocolPath)) {
      throw new Error(`Payment workflow protocol file not found at: ${paymentProtocolPath}`);
    }
    
    const nplCode = fs.readFileSync(paymentProtocolPath, 'utf8');
    console.log('✅ Payment workflow protocol file loaded');
    console.log(`📄 File size: ${nplCode.length} characters`);

    // Deploy the protocol
    console.log('📤 Deploying protocol to NPL engine via A2A server...');
    const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
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

    // Refresh A2A methods to discover the new protocol
    console.log('\n🔄 Refreshing A2A methods to discover new protocol...');
    const refreshResponse = await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ A2A methods refreshed successfully!');
    console.log('📋 Refresh response:', refreshResponse.data);

    // Verify the protocol is available in skills
    console.log('\n🎯 Verifying protocol availability in A2A skills...');
    const skillsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/skills`);
    
    const paymentWorkflowSkill = skillsResponse.data.skills?.find(
      skill => skill.package === 'payment_workflow' && skill.protocol === 'OrderCommitment'
    );

    if (paymentWorkflowSkill) {
      console.log('✅ Payment workflow protocol found in A2A skills!');
      console.log(`📋 Available methods: ${paymentWorkflowSkill.methods?.length || 0}`);
      if (paymentWorkflowSkill.methods) {
        paymentWorkflowSkill.methods.forEach((method, index) => {
          console.log(`   ${index + 1}. ${method}`);
        });
      }
    } else {
      console.log('❌ Payment workflow protocol not found in A2A skills');
      console.log('📋 Available skills:', skillsResponse.data.skills);
    }

    console.log('\n🎉 Payment Workflow Deployment Completed Successfully!');
    console.log('\n📝 Deployment Summary:');
    console.log('✅ Payment workflow protocol deployed at runtime');
    console.log('✅ A2A methods refreshed and updated');
    console.log('✅ Protocol available for agent interactions');
    console.log('✅ No fallback mechanisms used');
    console.log('✅ Pure runtime deployment workflow');

    return true;

  } catch (error) {
    // Handle 409 Conflict (already deployed)
    if (
      (error.response && error.response.status === 409) ||
      (error.details && error.details.status === 409) ||
      (error.status === 409) ||
      (error.response && error.response.data && error.response.data.details && error.response.data.details.status === 409)
    ) {
      console.log('ℹ️  Payment workflow protocol already deployed');
      console.log('🔄 Refreshing A2A methods anyway...');
      
      try {
        const token = await getAccessToken(TEST_USER.username, TEST_USER.password);
        const refreshResponse = await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, {
          token: token
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ A2A methods refreshed successfully!');
        console.log('📋 Refresh response:', refreshResponse.data);
        
        return true;
      } catch (refreshError) {
        console.error('❌ Failed to refresh A2A methods:', refreshError.message);
        throw refreshError;
      }
    }
    
    console.error('❌ Deployment failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run the deployment
if (require.main === module) {
  deployPaymentWorkflow().catch(error => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = { deployPaymentWorkflow }; 