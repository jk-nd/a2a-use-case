const { dynamicMethodManager } = require('./dist/dynamic-method-manager');

console.log('Testing Dynamic Method Manager...');

// Test 1: Check if methods are loaded
console.log('\n1. Available operations:', dynamicMethodManager.getAvailableOperations());
console.log('2. All mappings:', dynamicMethodManager.getAllMappings());

// Test 2: Test method mapping lookup
const mapping = dynamicMethodManager.findMethodMapping('rfp_workflow', 'RfpWorkflow', 'getRfpDetails');
console.log('\n3. Found mapping for getRfpDetails:', mapping);

// Test 3: Test method existence
const hasMethod = dynamicMethodManager.hasMethod('RfpWorkflow_getRfpDetails');
console.log('\n4. Has RfpWorkflow_getRfpDetails method:', hasMethod);

// Test 4: Test force refresh
console.log('\n5. Forcing refresh...');
dynamicMethodManager.forceRefresh();
console.log('   Refresh completed');

console.log('\nDynamic Method Manager test completed successfully!'); 