const https = require('https');
const http = require('http');

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

async function main() {
    try {
        // Get token for alice (who has admin privileges)
        const token = await getToken('alice', 'password123');
        console.log('JWT Token:');
        console.log(token);
        
        // Also save to file for easy use in tests
        const fs = require('fs');
        fs.writeFileSync('test-token.txt', token);
        console.log('\nToken saved to test-token.txt');
        
    } catch (error) {
        console.error('Error getting token:', error.message);
        process.exit(1);
    }
}

main(); 