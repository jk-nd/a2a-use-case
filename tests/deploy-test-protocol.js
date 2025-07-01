#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const JSZip = require('jszip');
const FormData = require('form-data');
const { execSync } = require('child_process');

const A2A_SERVER_URL = 'http://localhost:8000';
const NPL_ENGINE_URL = 'http://localhost:12000';
const NPL_MANAGEMENT_URL = 'http://localhost:12400';

async function getToken(username = 'buyer') {
    try {
        console.log(`🔑 Getting access token for ${username}...`);
        
        // Use the enhanced get-token.js script
        const token = execSync(`node get-token.js ${username}`, { 
            cwd: __dirname,
            encoding: 'utf8' 
        }).trim();
        
        // The script saves the token to a file, so read it
        const tokenFile = path.join(__dirname, 'test-token.txt');
        if (fs.existsSync(tokenFile)) {
            const tokenFromFile = fs.readFileSync(tokenFile, 'utf8').trim();
            console.log('✅ Token obtained successfully');
            return tokenFromFile;
        } else {
            throw new Error('Token file not found');
        }
    } catch (error) {
        console.error('❌ Failed to get token:', error.message);
        throw error;
    }
}

async function deployProtocol(token) {
    try {
        console.log('📦 Deploying test protocol via A2A service...');
        
        // Read the NPL protocol file
        const protocolPath = path.join(__dirname, 'test_deploy_protocol.npl');
        const nplCode = fs.readFileSync(protocolPath, 'utf8');
        
        // Create ZIP file with proper folder structure
        const zip = new JSZip();
        
        // Add the NPL file to the correct folder structure
        // NPL engine expects: src/main/npl-{version}/{package}/{protocol}.npl
        const nplPath = `src/main/npl-1.0.0/test_deploy/TestProtocol.npl`;
        zip.file(nplPath, nplCode);
        
        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        
        const deployResponse = await axios.post(`${A2A_SERVER_URL}/a2a/deploy`, {
            package: 'test_deploy',
            protocol: 'TestProtocol',
            nplCode: nplCode,
            token: token
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Protocol deployed successfully:', deployResponse.data);
        return deployResponse.data;
    } catch (error) {
        console.error('❌ Failed to deploy protocol:', error.response?.data || error.message);
        throw error;
    }
}

async function deployProtocolDirect(token) {
    try {
        console.log('📦 Deploying test protocol directly to NPL engine (management API)...');

        // Read the NPL protocol file
        const protocolPath = path.join(__dirname, 'test_deploy_protocol.npl');
        const nplCode = fs.readFileSync(protocolPath, 'utf8');

        // Create ZIP file with proper folder structure
        const zip = new JSZip();
        // Add the NPL file to the correct folder structure
        // NPL engine expects: src/main/npl-{version}/{package}/{protocol}.npl
        const nplPath = `src/main/npl-1.0.0/test_deploy/TestProtocol.npl`;
        zip.file(nplPath, nplCode);
        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Prepare multipart/form-data
        const form = new FormData();
        form.append('archive', zipBuffer, {
            filename: 'npl-sources.zip',
            contentType: 'application/zip'
        });

        const deployResponse = await axios.post(
            `${NPL_MANAGEMENT_URL}/management/application`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        console.log('✅ Protocol deployed directly to NPL engine:', deployResponse.data);
        return deployResponse.data;
    } catch (error) {
        console.error('❌ Failed to deploy protocol directly:', error.response?.data || error.message);
        throw error;
    }
}

async function refreshMethods(token) {
    try {
        console.log('🔄 Refreshing A2A methods...');
        
        const refreshResponse = await axios.post(`${A2A_SERVER_URL}/a2a/refresh`, {
            token: token
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Methods refreshed successfully:', refreshResponse.data);
        return refreshResponse.data;
    } catch (error) {
        console.error('❌ Failed to refresh methods:', error.response?.data || error.message);
        throw error;
    }
}

async function listProtocols(token) {
    try {
        console.log('📋 Listing deployed protocols...');
        
        const protocolsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/protocols`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Protocols listed successfully:', protocolsResponse.data);
        return protocolsResponse.data;
    } catch (error) {
        console.error('❌ Failed to list protocols:', error.response?.data || error.message);
        throw error;
    }
}

async function getAgentSkills() {
    try {
        console.log('🎯 Getting agent skills...');
        
        const skillsResponse = await axios.get(`${A2A_SERVER_URL}/a2a/skills`);
        
        console.log('✅ Agent skills retrieved successfully');
        return skillsResponse.data;
    } catch (error) {
        console.error('❌ Failed to get agent skills:', error.response?.data || error.message);
        throw error;
    }
}

async function testNewMethod(token) {
    try {
        console.log('🧪 Testing new method from deployed protocol...');
        
        // Decode the token to get the username
        const tokenParts = token.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const username = payload.preferred_username;
        
        console.log(`🔍 Using JWT claims for user: ${username}`);
        
        // Create a new instance of the deployed protocol with proper JWT claims
        const createResponse = await axios.post(`${NPL_ENGINE_URL}/npl/test_deploy/TestProtocol/`, {
            issuer: `${username}@example.com`,
                            recipient: 'supplier@vendor.com',
            initialValue: 100,
            "@parties": {
                issuer: {
                    entity: {
                        preferred_username: [username]
                    },
                    access: {}
                },
                recipient: {
                    entity: {
                        preferred_username: ["supplier"]
                    },
                    access: {}
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Protocol instance created:', createResponse.data);
        
        const protocolId = createResponse.data['@id'];
        
        // Test the startProcessing method
        const startResponse = await axios.post(`${NPL_ENGINE_URL}/npl/test_deploy/TestProtocol/${protocolId}/startProcessing`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ startProcessing method executed:', startResponse.data);
        
        return { protocolId, createResponse: createResponse.data, startResponse: startResponse.data };
    } catch (error) {
        console.error('❌ Failed to test new method:', error.response?.data || error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting dynamic protocol deployment test...\n');
        
        // Get username from command line args or use default
        const username = process.argv[2] || 'buyer';
        console.log(`👤 Using username: ${username}\n`);
        
        // Step 1: Get token for the specified user
        const token = await getToken(username);
        
        // Step 2: Get initial agent skills
        console.log('\n📊 Initial agent skills:');
        const initialSkills = await getAgentSkills();
        console.log('Protocols:', initialSkills.protocols);
        console.log('Skills count:', initialSkills.skills.length);
        
        // Step 3: Try to deploy the test protocol directly to NPL engine
        console.log('\n📦 Deploying test protocol directly to NPL engine...');
        try {
            await deployProtocolDirect(token);
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  Protocol already deployed, continuing with test...');
            } else {
                throw error;
            }
        }
        
        // Step 4: Refresh methods to pick up new protocol
        console.log('\n🔄 Refreshing methods...');
        await refreshMethods(token);
        
        // Step 5: Get updated agent skills
        console.log('\n📊 Updated agent skills:');
        const updatedSkills = await getAgentSkills();
        console.log('Protocols:', updatedSkills.protocols);
        console.log('Skills count:', updatedSkills.skills.length);
        
        // Step 6: List deployed protocols
        console.log('\n📋 Deployed protocols:');
        await listProtocols(token);
        
        // Step 7: Test the new method
        console.log('\n🧪 Testing new method...');
        await testNewMethod(token);
        
        console.log('\n🎉 Dynamic protocol deployment test completed successfully!');
        console.log('\n📝 Summary:');
        console.log('✅ Protocol deployed to NPL engine');
        console.log('✅ Methods dynamically updated');
        console.log('✅ New protocol methods available');
        console.log('✅ Protocol instance created and tested');
        console.log(`✅ Used JWT token for user: ${username}`);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
main(); 