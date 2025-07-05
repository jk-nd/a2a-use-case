#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

// Configuration
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:11000';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'noumena';
const CLIENT_ID = 'noumena';

// Technical user credentials
const TECHNICAL_USER = {
    username: 'a2a-technical-user',
    password: 'a2a-technical-password-123'
};

async function getTechnicalUserToken() {
    try {
        console.log('🔑 Getting technical user token for A2A server...');
        
        const response = await axios.post(
            `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: 'password',
                client_id: CLIENT_ID,
                username: TECHNICAL_USER.username,
                password: TECHNICAL_USER.password
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const token = response.data.access_token;
        
        if (!token) {
            throw new Error('No access token received from Keycloak');
        }

        console.log('✅ Technical user token obtained successfully');
        console.log(`Token: ${token.substring(0, 20)}...`);

        // Save token to file
        fs.writeFileSync('.technical-user-token', token);
        console.log('💾 Token saved to .technical-user-token');

        // Set environment variable
        process.env.NPL_TECHNICAL_USER_TOKEN = token;
        console.log('📋 Environment variable set:');
        console.log(`   NPL_TECHNICAL_USER_TOKEN=${token.substring(0, 20)}...`);

        console.log('');
        console.log('🚀 You can now start the A2A server with:');
        console.log(`   NPL_TECHNICAL_USER_TOKEN=${token} docker-compose up a2a-server`);
        console.log('');
        console.log('   Or source this script and run:');
        console.log('   source <(node scripts/get-technical-token.js) && docker-compose up a2a-server');

        return token;

    } catch (error) {
        console.error('❌ Failed to get technical user token:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the function
getTechnicalUserToken(); 