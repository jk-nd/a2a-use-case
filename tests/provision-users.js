const axios = require('axios');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('user-config.json', 'utf8'));

// Configuration
const KEYCLOAK_URL = config.keycloak.url;
const ADMIN_USERNAME = config.keycloak.admin_username;
const ADMIN_PASSWORD = config.keycloak.admin_password;
const REALM = config.realm;

// User definitions from config
const USERS = config.users;

async function getAdminToken() {
  try {
    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get admin token:', error.response?.data || error.message);
    throw error;
  }
}

async function createUser(userData, adminToken) {
  try {
    const userPayload = {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: userData.password,
          temporary: false
        }
      ],
      attributes: userData.attributes
    };

    const response = await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
      userPayload,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Created user: ${userData.username}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  User ${userData.username} already exists, skipping...`);
      return null;
    }
    console.error(`❌ Failed to create user ${userData.username}:`, error.response?.data || error.message);
    throw error;
  }
}

async function listUsers(adminToken) {
  try {
    const response = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to list users:', error.response?.data || error.message);
    throw error;
  }
}

async function provisionUsers() {
  console.log('🚀 Starting user provisioning for A2A workflow...\n');

  try {
    // Get admin token
    console.log('🔑 Getting admin token...');
    const adminToken = await getAdminToken();
    console.log('✅ Admin token obtained\n');

    // List existing users
    console.log('📋 Current users in realm:');
    const existingUsers = await listUsers(adminToken);
    existingUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });
    console.log('');

    // Create human users
    console.log('👥 Creating human users...');
    for (const user of USERS.humans) {
      await createUser(user, adminToken);
    }
    console.log('');

    // Create agent users
    console.log('🤖 Creating agent users...');
    for (const user of USERS.agents) {
      await createUser(user, adminToken);
    }
    console.log('');

    // List all users after provisioning
    console.log('📋 All users after provisioning:');
    const allUsers = await listUsers(adminToken);
    allUsers.forEach(user => {
      const isAgent = user.attributes?.role?.includes('agent');
      const icon = isAgent ? '🤖' : '👤';
      console.log(`  ${icon} ${user.username} (${user.email})`);
    });

    console.log('\n🎉 User provisioning completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test authentication with the new users');
    console.log('2. Verify agent capabilities in the A2A workflow');
    console.log('3. Configure agent API endpoints');

  } catch (error) {
    console.error('❌ User provisioning failed:', error.message);
    process.exit(1);
  }
}

// Run the provisioning
provisionUsers(); 