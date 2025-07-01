const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function getToken(username, password) {
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams({
            'grant_type': 'password',
            'client_id': 'noumena',
            'username': username,
            'password': password
        }).toString();

        const options = {
            hostname: 'localhost',
            port: 11000,
            path: '/realms/noumena/protocol/openid-connect/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.access_token) {
                        resolve(response.access_token);
                    } else {
                        reject(new Error('No access token in response'));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function decodeJWT(token) {
    try {
        const tokenParts = token.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        return payload;
    } catch (error) {
        console.error('Failed to decode JWT:', error.message);
        return null;
    }
}

function loadConfig() {
    // Hardcoded user configuration (matching keycloak-provisioning.sh)
    return {
        realm: 'noumena',
        keycloak: {
            url: 'http://localhost:11000',
            admin_username: 'admin',
            admin_password: 'admin'
        },
        users: {
            humans: [
                {
                    username: 'buyer',
                    email: 'buyer@company.com',
                    firstName: 'John',
                    lastName: 'Buyer',
                    password: 'password123'
                },
                {
                    username: 'supplier',
                    email: 'supplier@vendor.com',
                    firstName: 'Jane',
                    lastName: 'Supplier',
                    password: 'password123'
                },
                {
                    username: 'finance_manager',
                    email: 'finance@company.com',
                    firstName: 'Mike',
                    lastName: 'Finance',
                    password: 'password123'
                }
            ],
            agents: [
                {
                    username: 'procurement_agent',
                    email: 'procurement-agent@company.com',
                    firstName: 'Procurement',
                    lastName: 'Agent',
                    password: 'agent-password-123'
                },
                {
                    username: 'finance_agent',
                    email: 'finance-agent@company.com',
                    firstName: 'Finance',
                    lastName: 'Agent',
                    password: 'agent-password-123'
                },
                {
                    username: 'supplier_agent',
                    email: 'supplier-agent@vendor.com',
                    firstName: 'Supplier',
                    lastName: 'Agent',
                    password: 'agent-password-123'
                }
            ]
        }
    };
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Usage: node get-token.js <username> [output_file]');
        console.log('');
        
        // Try to load config and show available users
        const config = loadConfig();
        if (config) {
            console.log('Available users:');
            console.log('  Humans:');
            config.users.humans.forEach(user => {
                console.log(`    ${user.username} (${user.firstName} ${user.lastName})`);
            });
            console.log('  Agents:');
            config.users.agents.forEach(user => {
                console.log(`    ${user.username} (${user.firstName} ${user.lastName})`);
            });
        } else {
            console.log('Default user: buyer');
        }
        
        console.log('');
        console.log('Examples:');
        console.log('  node get-token.js buyer');
        console.log('  node get-token.js buyer token.txt');
        console.log('  node get-token.js finance_manager');
        process.exit(1);
    }

    const username = args[0];
    const outputFile = args[1] || 'test-token.txt';
    
    let password = 'password123'; // Default password
    
    // Try to get password from config
    const config = loadConfig();
    if (config) {
        const user = [...config.users.humans, ...config.users.agents].find(u => u.username === username);
        if (user) {
            password = user.password;
        }
    }

    try {
        console.log(`🔑 Getting JWT token for ${username}...`);
        const token = await getToken(username, password);
        
        // Decode and display claims
        const claims = decodeJWT(token);
        
        console.log('✅ Token obtained successfully!');
        console.log('');
        console.log('🔍 JWT Claims:');
        console.log(`   Subject (sub): ${claims.sub}`);
        console.log(`   Username (preferred_username): ${claims.preferred_username}`);
        console.log(`   Email: ${claims.email}`);
        console.log(`   Name: ${claims.name}`);
        console.log(`   Roles: ${claims.realm_access?.roles?.join(', ') || 'none'}`);
        console.log(`   Expires: ${new Date(claims.exp * 1000).toISOString()}`);
        console.log('');
        
        // Save token to file
        fs.writeFileSync(outputFile, token);
        console.log(`💾 Token saved to: ${outputFile}`);
        console.log('');
        console.log('📋 Usage in API calls:');
        console.log(`   Authorization: Bearer $(cat ${outputFile})`);
        console.log('');
        console.log('🔐 For NPL Protocol Instantiation:');
        console.log('   This token can be used to instantiate protocols where the user');
        console.log('   is mapped to a party via the @parties object:');
        console.log(`   "@parties": {`);
        console.log(`     "someParty": {`);
        console.log(`       "entity": { "preferred_username": ["${username}"] },`);
        console.log(`       "access": {}`);
        console.log(`     }`);
        console.log(`   }`);
        
    } catch (error) {
        console.error('❌ Error getting token:', error.message);
        process.exit(1);
    }
}

main(); 