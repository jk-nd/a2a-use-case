const axios = require('axios');

// Configuration
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:11000';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'noumena';
const CLIENT_ID = 'noumena';

// Technical user credentials
const TECHNICAL_USER = {
    username: 'a2a-technical-user',
    password: 'a2a-technical-password-123'
};

/**
 * Get a fresh technical user token from Keycloak
 * @returns {Promise<string>} Technical user access token
 */
async function getTechnicalUserToken() {
    try {
        console.log('🔑 Getting fresh technical user token...');
        
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

        console.log('✅ Fresh technical user token obtained');
        return token;

    } catch (error) {
        console.error('❌ Failed to get technical user token:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

/**
 * Get a regular user token from Keycloak
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<string>} User access token
 */
async function getUserToken(username, password) {
    try {
        const response = await axios.post(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, 
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
 * Trigger A2A server to refresh its token internally
 * @returns {Promise<void>}
 */
async function updateA2AServerToken() {
    try {
        console.log('🔄 Triggering A2A server token refresh...');
        
        // The A2A server has built-in token refresh mechanisms
        // We just need to trigger a refresh via the /a2a/refresh endpoint
        const token = await getTechnicalUserToken();
        
        const response = await axios.post('http://localhost:8000/a2a/refresh', {
            token: token
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ A2A server token refresh triggered successfully');
        console.log('📋 Refresh response:', response.data);
        
    } catch (error) {
        console.error('❌ Failed to trigger A2A server token refresh:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

module.exports = {
    getTechnicalUserToken,
    getUserToken,
    updateA2AServerToken
}; 