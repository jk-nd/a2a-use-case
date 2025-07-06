
/**
 * Generated method mappings for NPL protocols
 * Maps A2A method calls to NPL engine endpoints
 */
const METHOD_MAPPINGS = [
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "_getopenapi",
    "operationId": "_getOpenAPI",
    "path": "/npl/payment_workflow/-/openapi.json",
    "summary": "_getopenapi operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "_getordercommitmentlist",
    "operationId": "_getOrderCommitmentList",
    "path": "/npl/payment_workflow/OrderCommitment/",
    "summary": "_getordercommitmentlist operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "_createordercommitment",
    "operationId": "_createOrderCommitment",
    "path": "/npl/payment_workflow/OrderCommitment/",
    "summary": "_createordercommitment operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "_getordercommitmentbyid",
    "operationId": "_getOrderCommitmentByID",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/",
    "summary": "_getordercommitmentbyid operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "committopay",
    "operationId": "OrderCommitment_commitToPay",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/commitToPay",
    "summary": "committopay operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "committodeliver",
    "operationId": "OrderCommitment_commitToDeliver",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/commitToDeliver",
    "summary": "committodeliver operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "markdelivered",
    "operationId": "OrderCommitment_markDelivered",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/markDelivered",
    "summary": "markdelivered operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "pay",
    "operationId": "OrderCommitment_pay",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/pay",
    "summary": "pay operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "complete",
    "operationId": "OrderCommitment_complete",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/complete",
    "summary": "complete operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "cancel",
    "operationId": "OrderCommitment_cancel",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/cancel",
    "summary": "cancel operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "getstatus",
    "operationId": "OrderCommitment_getStatus",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/getStatus",
    "summary": "getstatus operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "gettotalamount",
    "operationId": "OrderCommitment_getTotalAmount",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/getTotalAmount",
    "summary": "gettotalamount operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "getorderdetails",
    "operationId": "OrderCommitment_getOrderDetails",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/getOrderDetails",
    "summary": "getorderdetails operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "isorderagentcommitted",
    "operationId": "OrderCommitment_isOrderAgentCommitted",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/isOrderAgentCommitted",
    "summary": "isorderagentcommitted operation for payment_workflow.OrderCommitment"
  },
  {
    "package": "payment_workflow",
    "protocol": "OrderCommitment",
    "method": "issupplieragentcommitted",
    "operationId": "OrderCommitment_isSupplierAgentCommitted",
    "path": "/npl/payment_workflow/OrderCommitment/{id}/isSupplierAgentCommitted",
    "summary": "issupplieragentcommitted operation for payment_workflow.OrderCommitment"
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
