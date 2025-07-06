
/**
 * Generated agent skills for NPL protocols
 * Defines available methods for each protocol
 */
const AGENT_SKILLS = [
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "methods": [
      {
        "name": "_getopenapi",
        "description": "_getopenapi operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "_getordercommitmentlist",
        "description": "_getordercommitmentlist operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "_createordercommitment",
        "description": "_createordercommitment operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "_getordercommitmentbyid",
        "description": "_getordercommitmentbyid operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "committopay",
        "description": "committopay operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "committodeliver",
        "description": "committodeliver operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "markdelivered",
        "description": "markdelivered operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "pay",
        "description": "pay operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "complete",
        "description": "complete operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "cancel",
        "description": "cancel operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "getstatus",
        "description": "getstatus operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "gettotalamount",
        "description": "gettotalamount operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "getorderdetails",
        "description": "getorderdetails operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "isorderagentcommitted",
        "description": "isorderagentcommitted operation for payment_workflow.OrderCommitment"
      },
      {
        "name": "issupplieragentcommitted",
        "description": "issupplieragentcommitted operation for payment_workflow.OrderCommitment"
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
