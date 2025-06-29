
/**
 * Generated agent skills for NPL protocols
 * Defines available methods for each protocol
 */
const AGENT_SKILLS = [
  {
    "package": "test_deploy",
    "protocol": "TestProtocol",
    "methods": [
      {
        "name": "listmyprotocols",
        "description": "List all protocol instances where the authenticated party is involved in test_deploy.TestProtocol"
      },
      {
        "name": "getmyprotocolcontent",
        "description": "Get full content of a specific protocol instance for test_deploy.TestProtocol"
      },
      {
        "name": "startprocessing",
        "description": "startProcessing operation for test_deploy.TestProtocol"
      },
      {
        "name": "updatevalue",
        "description": "updateValue operation for test_deploy.TestProtocol"
      },
      {
        "name": "complete",
        "description": "complete operation for test_deploy.TestProtocol"
      },
      {
        "name": "fail",
        "description": "fail operation for test_deploy.TestProtocol"
      },
      {
        "name": "getprocessingtime",
        "description": "getProcessingTime operation for test_deploy.TestProtocol"
      }
    ]
  }
];

/**
 * Get available skills for a package and protocol
 */
function getProtocolSkills(package, protocol) {
    return AGENT_SKILLS.find(s => s.package === package && s.protocol === protocol);
}

/**
 * Get all available packages and protocols
 */
function getAllProtocols() {
    return AGENT_SKILLS.map(s => ({ package: s.package, protocol: s.protocol }));
}

module.exports = { AGENT_SKILLS, getProtocolSkills, getAllProtocols };
