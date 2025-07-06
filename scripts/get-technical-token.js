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
        console.error('🔑 Getting technical user token for A2A server...');
        
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

        // Save token to file
        fs.writeFileSync('.technical-user-token', token);
        
        // Set environment variable
        process.env.NPL_TECHNICAL_USER_TOKEN = token;

        // Log to stderr so stdout only contains the token
        console.error('✅ Technical user token obtained successfully');
        console.error(`💾 Token saved to .technical-user-token`);
        console.error('📋 Environment variable set');
        
        // Output token to stdout for shell script capture
        console.log(token);

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