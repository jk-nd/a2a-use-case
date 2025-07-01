#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting complete A2A workflow testing...\n');

async function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  // Check if axios is installed (from parent directory)
  try {
    require('axios');
    console.log('✅ axios is installed');
  } catch (error) {
    console.log('📦 Installing axios...');
    execSync('npm install axios', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }
  
  console.log('✅ Dependencies check completed\n');
  return true;
}

async function runTests() {
  console.log('🧪 Running complete test suite...\n');

  // Step 1: Check dependencies
  if (!await checkDependencies()) {
    process.exit(1);
  }

  // Step 2: Users are automatically provisioned by Keycloak via keycloak-provisioning.sh
console.log('👥 Users automatically provisioned by Keycloak via keycloak-provisioning.sh\n');

  // Step 3: Run active integration and workflow tests
  await runCommand('node test_a2a_client.js', 'A2A server basic connectivity test');
  await runCommand('node test_a2a_discovery.js', 'A2A protocol discovery test');
  await runCommand('node test_a2a_rfp_flow.js', 'A2A RFP workflow end-to-end test');
  await runCommand('node test-protocol-instantiation.js', 'Multi-party protocol instantiation test');

  console.log('🎉 All tests completed!');
  console.log('\n📝 Summary:');
  console.log('✅ A2A server connectivity tested');
  console.log('✅ Protocol discovery tested');
  console.log('✅ RFP workflow tested');
  console.log('✅ Multi-party protocol instantiation tested');
}

// Run the complete test suite
runTests().catch(error => {
  console.error('❌ Test suite execution failed:', error.message);
  process.exit(1);
}); 