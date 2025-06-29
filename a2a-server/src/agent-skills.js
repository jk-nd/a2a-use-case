
/**
 * Generated agent skills for NPL protocols
 * Defines available methods for each protocol
 */
const AGENT_SKILLS = [
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "methods": [
      {
        "name": "getrfpdetails",
        "description": "getRfpDetails operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "submitforapproval",
        "description": "submitForApproval operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "approvebudget",
        "description": "approveBudget operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "rejectbudget",
        "description": "rejectBudget operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "activaterfp",
        "description": "activateRfp operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "cancelrfp",
        "description": "cancelRfp operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "cancelrfpbyfinance",
        "description": "cancelRfpByFinance operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "getcurrentbudget",
        "description": "getCurrentBudget operation for rfp_workflow.RfpWorkflow"
      },
      {
        "name": "getbudgetapproval",
        "description": "getBudgetApproval operation for rfp_workflow.RfpWorkflow"
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
