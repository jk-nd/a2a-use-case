
/**
 * Generated method mappings for NPL protocols
 * Maps A2A method calls to NPL engine endpoints
 */
const METHOD_MAPPINGS = [
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "listmyprotocols",
    "operationId": "test_deploy_TestProtocol_listMyProtocols",
    "path": "/npl/test_deploy/TestProtocol/",
    "summary": "List all protocol instances for test_deploy.TestProtocol"
  },
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "getmyprotocolcontent",
    "operationId": "test_deploy_TestProtocol_getMyProtocolContent",
    "path": "/npl/test_deploy/TestProtocol/{id}/",
    "summary": "Get protocol content for test_deploy.TestProtocol"
  },
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "startprocessing",
    "operationId": "TestProtocol_startProcessing",
    "path": "/npl/test_deploy/TestProtocol/{id}/startProcessing",
    "summary": "TestProtocol_startProcessing"
  },
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "updatevalue",
    "operationId": "TestProtocol_updateValue",
    "path": "/npl/test_deploy/TestProtocol/{id}/updateValue",
    "summary": "TestProtocol_updateValue"
  },
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "complete",
    "operationId": "TestProtocol_complete",
    "path": "/npl/test_deploy/TestProtocol/{id}/complete",
    "summary": "TestProtocol_complete"
  },
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "fail",
    "operationId": "TestProtocol_fail",
    "path": "/npl/test_deploy/TestProtocol/{id}/fail",
    "summary": "TestProtocol_fail"
  },
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "method": "getprocessingtime",
    "operationId": "TestProtocol_getProcessingTime",
    "path": "/npl/test_deploy/TestProtocol/{id}/getProcessingTime",
    "summary": "TestProtocol_getProcessingTime"
  }
];

/**
 * Find method mapping by package, protocol and method
 */
function findMethodMapping(package, protocol, method) {
    return METHOD_MAPPINGS.find(m => 
        m.package === package && m.protocol === protocol && m.method === method.toLowerCase()
    );
}

module.exports = { METHOD_MAPPINGS, findMethodMapping };
