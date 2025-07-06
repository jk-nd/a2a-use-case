#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Starting complete A2A workflow testing...\n');

async function clearEngine() {
  console.log('🧹 Clearing NPL engine state...');
  
  try {
    // Check if .technical-user-token file exists
    const tokenFile = path.join(__dirname, '..', '.technical-user-token');
    let token;
    
    if (fs.existsSync(tokenFile)) {
      // Read token from file
      token = fs.readFileSync(tokenFile, 'utf8').trim();
    } else {
      // Get technical token from script
      const tokenScript = path.join(__dirname, '..', 'scripts', 'get-technical-token.js');
      const tokenOutput = execSync(`node ${tokenScript}`, { 
        encoding: 'utf8', 
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Extract token from output
      const tokenMatch = tokenOutput.match(/NPL_TECHNICAL_USER_TOKEN=([^\s]+)/);
      if (!tokenMatch) {
        throw new Error('Could not extract technical token from script output');
      }
      
      token = tokenMatch[1];
    }
    
    // Clear engine contents
    const response = await axios.delete('http://localhost:12400/management/application/contents', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ Engine state cleared successfully');
    return true;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Engine management API not available, skipping engine clear');
      return true;
    }
    
    console.log(`⚠️  Failed to clear engine: ${error.message}`);
    console.log('   Continuing with tests...');
    return true; // Continue with tests even if clear fails
  }
}

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

// Test configuration
const TESTS = [
  {
    name: 'Payment Workflow Deployment',
    file: 'deploy-payment-workflow.js',
    description: 'Deploy payment workflow protocol at runtime'
  },
  {
    name: 'Payment Workflow Integration Test',
    file: 'test_payment_workflow_deployment_and_workflow.js',
    description: 'Complete payment workflow deployment and execution test'
  },
  {
    name: 'A2A Discovery Test',
    file: 'test_a2a_discovery.js',
    description: 'Test A2A discovery with runtime-deployed protocols'
  },
  {
    name: 'Payment Use Case Test',
    file: 'payment-use-case/test_npl_protocol.js',
    description: 'Test payment use case with NPL protocol'
  },
  {
    name: 'A2A Client Test',
    file: 'test_a2a_client.js',
    description: 'Test A2A client functionality'
  },
  {
    name: 'Protocol Instantiation Test',
    file: 'test-protocol-instantiation.js',
    description: 'Test protocol instantiation'
  },
  {
    name: 'Agent Communication Test',
    file: 'test-agent-communication.js',
    description: 'Test agent registration, discovery, and communication'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, testFile);
    
    log(`\n${colors.cyan}🧪 Running: ${testFile}${colors.reset}`);
    
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${testFile} completed successfully`, 'green');
        resolve();
      } else {
        log(`❌ ${testFile} failed with exit code ${code}`, 'red');
        reject(new Error(`Test ${testFile} failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      log(`❌ Failed to start ${testFile}: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function runAllTests() {
  log('\n🚀 Starting A2A Runtime Deployment Test Suite', 'bright');
  log('📋 Focus: Runtime deployment of NPL protocols without fallback mechanisms', 'yellow');
  log(`📅 Started at: ${new Date().toISOString()}`, 'blue');
  
  // Clear engine state before running tests
  await clearEngine();
  
  const results = {
    passed: 0,
    failed: 0,
    total: TESTS.length
  };

  for (const test of TESTS) {
    try {
      log(`\n${colors.magenta}📋 Test: ${test.name}${colors.reset}`);
      log(`${colors.blue}📝 Description: ${test.description}${colors.reset}`);
      
      await runTest(test.file);
      results.passed++;
      
    } catch (error) {
      results.failed++;
      log(`❌ Test failed: ${test.name}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      
      // Ask user if they want to continue with remaining tests
      log(`\n${colors.yellow}⚠️  Test failed. Continue with remaining tests? (y/n)${colors.reset}`);
      
      // For now, continue with remaining tests
      log(`${colors.blue}Continuing with remaining tests...${colors.reset}`);
    }
  }

  // Summary
  log('\n📊 Test Suite Summary', 'bright');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📋 Total: ${results.total}`, 'blue');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed! Runtime deployment workflow is working correctly.', 'green');
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed. Please review the errors above.`, 'yellow');
  }

  return results;
}

// Run specific test if provided as argument
async function runSpecificTest(testName) {
  const test = TESTS.find(t => 
    t.name.toLowerCase().includes(testName.toLowerCase()) ||
    t.file.toLowerCase().includes(testName.toLowerCase())
  );

  if (!test) {
    log(`❌ Test not found: ${testName}`, 'red');
    log('Available tests:', 'blue');
    TESTS.forEach(t => log(`   - ${t.name} (${t.file})`, 'blue'));
    process.exit(1);
  }

  log(`\n🎯 Running specific test: ${test.name}`, 'bright');
  await runTest(test.file);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    runSpecificTest(args[0]).catch(error => {
      log(`❌ Test execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
  } else {
    runAllTests().catch(error => {
      log(`❌ Test suite execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
  }
}

module.exports = { runAllTests, runSpecificTest, TESTS }; 