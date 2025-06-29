#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const JSZip = require('jszip');
const FormData = require('form-data');

const A2A_SERVER_URL = 'http://localhost:8000';
const NPL_ENGINE_URL = 'http://localhost:12000';
const NPL_MANAGEMENT_URL = 'http://localhost:12400';

async function getToken() {
    try {
        console.log('🔑 Getting access token...');
        
        const tokenResponse = await axios.post('http://localhost:11000/realms/noumena/protocol/openid-connect/token', 
            'grant_type=password&client_id=noumena&username=alice&password=password123',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        const token = tokenResponse.data.access_token;
        console.log('✅ Token obtained successfully');
        return token;
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
        
        // Create a new instance of the deployed protocol
        const createResponse = await axios.post(`${NPL_ENGINE_URL}/npl/test_deploy/TestProtocol/`, {
            issuer: 'alice@example.com',
            recipient: 'bob@example.com',
            initialValue: 100
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
        
        // Step 1: Get token
        const token = await getToken();
        
        // Step 2: Get initial agent skills
        console.log('\n📊 Initial agent skills:');
        const initialSkills = await getAgentSkills();
        console.log('Protocols:', initialSkills.protocols);
        console.log('Skills count:', initialSkills.skills.length);
        
        // Step 3: Deploy the test protocol directly to NPL engine
        console.log('\n📦 Deploying test protocol directly to NPL engine...');
        await deployProtocolDirect(token);
        
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
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
main(); 