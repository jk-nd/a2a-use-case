#!/usr/bin/env node

/**
 * Test script for NPL Protocol Generator service
 * Tests protocol generation, validation, and deployment endpoints
 */

const axios = require('axios');

const BASE_URL = process.env.PROTOCOL_GENERATOR_URL || 'http://localhost:3003';

// Test data
const testRequirements = {
  name: "Simple Payment Agreement",
  description: "A simple payment agreement between a buyer and seller with basic validation",
  parties: ["buyer", "seller"],
  states: ["pending", "paid", "completed"],
  interactions: [
    {
      name: "makePayment",
      description: "Buyer makes a payment to the seller",
      fromParty: "buyer",
      parameters: [
        {
          name: "amount",
          type: "Number",
          description: "The payment amount",
          required: true
        }
      ]
    },
    {
      name: "confirmPayment",
      description: "Seller confirms receipt of payment",
      fromParty: "seller"
    }
  ],
  businessRules: [
    "Payment amount must be strictly positive",
    "Only the buyer can make payments",
    "Only the seller can confirm payments",
    "Payment confirmation moves the protocol to completed state"
  ]
};

async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testTemplates() {
  console.log('\n📋 Testing templates endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/templates`);
    console.log('✅ Templates retrieved:', response.data.templates.length, 'templates');
    response.data.templates.forEach(template => {
      console.log(`   - ${template.name} (${template.complexity})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Templates test failed:', error.message);
    return false;
  }
}

async function testProtocolGeneration() {
  console.log('\n🚀 Testing protocol generation...');
  try {
    const response = await axios.post(`${BASE_URL}/generate`, {
      requirements: testRequirements,
      options: {
        validationLevel: 'strict',
        aiEnhancement: true,
        includeUML: true
      }
    });

    console.log('✅ Protocol generation successful');
    console.log('   Request ID:', response.data.requestId);
    console.log('   Template:', response.data.metadata.template);
    console.log('   Validation Level:', response.data.metadata.validationLevel);
    
    // Check generated code
    const nplCode = response.data.protocol.nplCode;
    console.log('   NPL Code Length:', nplCode.length, 'characters');
    console.log('   Has Package Declaration:', nplCode.includes('package'));
    console.log('   Has Protocol Declaration:', nplCode.includes('protocol['));
    
    // Check validation results
    const validationResults = response.data.protocol.validationResults;
    const errors = validationResults.filter(r => r.severity === 'error');
    const warnings = validationResults.filter(r => r.severity === 'warning');
    
    console.log('   Validation Results:', {
      total: validationResults.length,
      errors: errors.length,
      warnings: warnings.length
    });

    if (errors.length > 0) {
      console.log('   ⚠️  Validation Errors:');
      errors.forEach(error => {
        console.log(`      - ${error.message} (line ${error.line})`);
      });
    }

    return {
      success: true,
      nplCode: nplCode,
      validationResults: validationResults
    };
  } catch (error) {
    console.error('❌ Protocol generation failed:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testValidation() {
  console.log('\n🔍 Testing validation endpoint...');
  
  const testNPLCode = `package test

/**
 * Test protocol for validation
 */
@api
protocol[buyer, seller] TestProtocol(var amount: Number) {
    require(amount > 0, "Amount must be positive");

    initial state pending;
    final state completed;

    /**
     * Make payment
     * @param paymentAmount The amount to pay
     */
    @api
    permission[buyer] makePayment(paymentAmount: Number) | pending {
        require(paymentAmount > 0, "Payment amount must be positive");
        become completed;
    };
}`;

  try {
    const response = await axios.post(`${BASE_URL}/validate`, {
      nplCode: testNPLCode,
      level: 'full'
    });

    console.log('✅ Validation test successful');
    console.log('   Request ID:', response.data.requestId);
    console.log('   Validation Summary:', response.data.validation.summary);
    
    const results = response.data.validation.results;
    if (results.length > 0) {
      console.log('   Validation Results:');
      results.forEach(result => {
        const icon = result.severity === 'error' ? '❌' : result.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`      ${icon} ${result.type}: ${result.message}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Validation test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDeployment() {
  console.log('\n🚀 Testing deployment endpoint...');
  
  const testNPLCode = `package payment_test

/**
 * Test payment protocol
 */
@api
protocol[buyer, seller] PaymentTest(var amount: Number) {
    require(amount > 0, "Amount must be positive");

    initial state pending;
    final state completed;

    @api
    permission[buyer] pay() | pending {
        become completed;
    };
}`;

  try {
    const response = await axios.post(`${BASE_URL}/deploy`, {
      nplCode: testNPLCode,
      packageName: 'payment_test',
      environment: 'local'
    });

    console.log('✅ Deployment test successful');
    console.log('   Request ID:', response.data.requestId);
    console.log('   Deployment ID:', response.data.deployment.deploymentId);
    console.log('   Environment:', response.data.deployment.environment);
    console.log('   Endpoints:', response.data.deployment.endpoints.length);

    return true;
  } catch (error) {
    console.error('❌ Deployment test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting NPL Protocol Generator Tests\n');
  console.log('Service URL:', BASE_URL);
  console.log('=' .repeat(50));

  const results = {
    healthCheck: false,
    templates: false,
    generation: false,
    validation: false,
    deployment: false
  };

  // Run tests
  results.healthCheck = await testHealthCheck();
  results.templates = await testTemplates();
  
  const generationResult = await testProtocolGeneration();
  results.generation = generationResult.success;
  
  results.validation = await testValidation();
  results.deployment = await testDeployment();

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  const testNames = {
    healthCheck: 'Health Check',
    templates: 'Templates',
    generation: 'Protocol Generation',
    validation: 'Validation',
    deployment: 'Deployment'
  };

  let passed = 0;
  let total = 0;

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[test]}`);
    if (result) passed++;
    total++;
  });

  console.log('\n' + '=' .repeat(50));
  console.log(`Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! NPL Protocol Generator is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the service configuration.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
NPL Protocol Generator Test Script

Usage: node test-protocol-generator.js [options]

Options:
  --url <url>     Set the service URL (default: http://localhost:3003)
  --help, -h      Show this help message

Environment Variables:
  PROTOCOL_GENERATOR_URL  Service URL override
`);
  process.exit(0);
}

// Extract URL from command line
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.PROTOCOL_GENERATOR_URL = process.argv[urlIndex + 1];
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
}); 