const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'user-config.json'), 'utf8'));

// Configuration
const KEYCLOAK_URL = config.keycloak.url;
const REALM = config.realm;
const CLIENT_ID = 'noumena';

async function testUserAuthentication(username, password) {
  try {
    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: username,
        password: password
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return {
      success: true,
      token: response.data.access_token,
      userInfo: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

async function testAllUsers() {
  console.log('🧪 Testing user authentication for all provisioned users...\n');

  const allUsers = [...config.users.humans, ...config.users.agents];
  const results = [];

  for (const user of allUsers) {
    console.log(`🔐 Testing authentication for ${user.username}...`);
    const result = await testUserAuthentication(user.username, user.password);
    
    if (result.success) {
      console.log(`✅ ${user.username} - Authentication successful`);
      results.push({
        username: user.username,
        type: user.attributes?.role?.includes('agent') ? 'Agent' : 'Human',
        status: 'SUCCESS'
      });
    } else {
      console.log(`❌ ${user.username} - Authentication failed:`, result.error);
      results.push({
        username: user.username,
        type: user.attributes?.role?.includes('agent') ? 'Agent' : 'Human',
        status: 'FAILED',
        error: result.error
      });
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'FAILED');
  
  console.log(`✅ Successful: ${successful.length}/${allUsers.length}`);
  console.log(`❌ Failed: ${failed.length}/${allUsers.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully authenticated users:');
    successful.forEach(user => {
      console.log(`  ${user.type}: ${user.username}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed authentication:');
    failed.forEach(user => {
      console.log(`  ${user.type}: ${user.username} - ${user.error?.error_description || user.error}`);
    });
  }

  return results;
}

async function testNplApiAccess() {
  console.log('\n🔗 Testing NPL API access...\n');
  
  // Test with a human user first
  const buyerResult = await testUserAuthentication('buyer', 'password123');
  
  if (!buyerResult.success) {
    console.log('❌ Cannot test NPL API access - buyer authentication failed');
    return;
  }

  try {
    // Test accessing the NPL API
    const response = await axios.get(
      'http://localhost:12000/api/v1/rfp_workflow/rfp_request',
      {
        headers: {
          'Authorization': `Bearer ${buyerResult.token}`
        }
      }
    );
    
    console.log('✅ NPL API access successful');
    console.log(`📋 Available RFP requests: ${response.data.length || 0}`);
    
  } catch (error) {
    console.log('❌ NPL API access failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  try {
    await testAllUsers();
    await testNplApiAccess();
    
    console.log('\n🎉 User provisioning tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests(); 