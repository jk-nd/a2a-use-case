
/**
 * Generated method mappings for NPL protocols
 * Maps A2A method calls to NPL engine endpoints
 */
const METHOD_MAPPINGS = [
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "listmyprotocols",
    "operationId": "rfp_workflow_RfpWorkflow_listMyProtocols",
    "path": "/npl/rfp_workflow/RfpWorkflow/",
    "summary": "List all protocol instances for rfp_workflow.RfpWorkflow"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "getmyprotocolcontent",
    "operationId": "rfp_workflow_RfpWorkflow_getMyProtocolContent",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/",
    "summary": "Get protocol content for rfp_workflow.RfpWorkflow"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "getrfpdetails",
    "operationId": "RfpWorkflow_getRfpDetails",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/getRfpDetails",
    "summary": "RfpWorkflow_getRfpDetails"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "submitforapproval",
    "operationId": "RfpWorkflow_submitForApproval",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/submitForApproval",
    "summary": "RfpWorkflow_submitForApproval"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "approvebudget",
    "operationId": "RfpWorkflow_approveBudget",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/approveBudget",
    "summary": "RfpWorkflow_approveBudget"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "rejectbudget",
    "operationId": "RfpWorkflow_rejectBudget",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/rejectBudget",
    "summary": "RfpWorkflow_rejectBudget"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "activaterfp",
    "operationId": "RfpWorkflow_activateRfp",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/activateRfp",
    "summary": "RfpWorkflow_activateRfp"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "cancelrfp",
    "operationId": "RfpWorkflow_cancelRfp",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/cancelRfp",
    "summary": "RfpWorkflow_cancelRfp"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "cancelrfpbyfinance",
    "operationId": "RfpWorkflow_cancelRfpByFinance",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/cancelRfpByFinance",
    "summary": "RfpWorkflow_cancelRfpByFinance"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "getcurrentbudget",
    "operationId": "RfpWorkflow_getCurrentBudget",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/getCurrentBudget",
    "summary": "RfpWorkflow_getCurrentBudget"
  },
  {
    "package": "rfp_workflow",
    "protocol": "RfpWorkflow",
    "method": "getbudgetapproval",
    "operationId": "RfpWorkflow_getBudgetApproval",
    "path": "/npl/rfp_workflow/RfpWorkflow/{id}/getBudgetApproval",
    "summary": "RfpWorkflow_getBudgetApproval"
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
