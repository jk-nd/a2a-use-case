const fs = require('fs');
const path = require('path');

// Read the test token
const token = fs.readFileSync('test-token.txt', 'utf8').trim();

// Debug: Show the token being used
console.log('🔍 Token being used for deployment:');
console.log('Token starts with:', token.substring(0, 50) + '...');
console.log('Token ends with:', '...' + token.substring(token.length - 50));

// Read the NPL protocol file
const nplCode = fs.readFileSync('test-auto-discovery.npl', 'utf8');

// Deploy the protocol
async function deployProtocol() {
    try {
        console.log('Deploying auto_discovery.AutoTest protocol...');
        
        const response = await fetch('http://localhost:8000/a2a/deploy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                package: 'auto_discovery',
                protocol: 'AutoTest',
                nplCode: nplCode,
                token: token
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Protocol deployed successfully!');
            console.log('Result:', JSON.stringify(result, null, 2));
            
            // Wait a moment for automatic discovery
            console.log('Waiting for automatic discovery...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if the protocol is now available
            const skillsResponse = await fetch('http://localhost:8000/a2a/skills');
            const skills = await skillsResponse.json();
            
            console.log('\n📋 Available protocols after deployment:');
            skills.protocols.forEach(p => {
                console.log(`  - ${p.package}.${p.protocol}`);
            });
            
            const autoTestSkills = skills.skills.find(s => s.package === 'auto_discovery');
            if (autoTestSkills) {
                console.log('\n🔧 Available methods for auto_discovery.AutoTest:');
                autoTestSkills.methods.forEach(m => {
                    console.log(`  - ${m.name}: ${m.description}`);
                });
            }
            
        } else {
            console.error('❌ Deployment failed:', result.error);
            console.log('Full response:', JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error deploying protocol:', error);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response headers:', error.response.headers);
            try {
                const errorBody = await error.response.text();
                console.log('Response body:', errorBody);
            } catch (e) {
                console.log('Could not read response body:', e.message);
            }
        }
    }
}

deployProtocol(); 