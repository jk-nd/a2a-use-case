const fs = require('fs');
const https = require('https');
const http = require('http');

async function testDeployment() {
    try {
        // Read the NPL code and token
        const nplCode = fs.readFileSync('test_protocol.npl', 'utf8');
        const token = fs.readFileSync('test-token.txt', 'utf8').trim();

        console.log('Testing protocol deployment...');
        console.log('Package: test_workflow');
        console.log('Protocol: TestProtocol');
        console.log('Token length:', token.length);

        const postData = JSON.stringify({
            package: 'test_workflow',
            protocol: 'TestProtocol',
            nplCode: nplCode,
            token: token
        });

        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/a2a/deploy',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    console.log('Response status:', res.statusCode);
                    console.log('Response headers:', res.headers);
                    
                    if (data) {
                        const response = JSON.parse(data);
                        console.log('Response:', JSON.stringify(response, null, 2));
                    } else {
                        console.log('Empty response body');
                    }
                } catch (error) {
                    console.error('Failed to parse response:', error.message);
                    console.log('Raw response:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error.message);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testDeployment(); 