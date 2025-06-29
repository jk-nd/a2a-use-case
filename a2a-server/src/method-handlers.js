
/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_getRfpDetails
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_getRfpDetails(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/getRfpDetails';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_submitForApproval
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_submitForApproval(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/submitForApproval';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_approveBudget
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_approveBudget(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/approveBudget';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_rejectBudget
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_rejectBudget(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/rejectBudget';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_activateRfp
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_activateRfp(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/activateRfp';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_cancelRfp
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_cancelRfp(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/cancelRfp';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_cancelRfpByFinance
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_cancelRfpByFinance(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/cancelRfpByFinance';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_getCurrentBudget
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_getCurrentBudget(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/getCurrentBudget';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}


/**
 * Generated A2A method handler for rfp_workflow_RfpWorkflow - RfpWorkflow_getBudgetApproval
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function RfpWorkflow_getBudgetApproval(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/rfp_workflow/RfpWorkflow/{id}/getBudgetApproval';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);

    
    // Add query parameters
    const queryParams = new URLSearchParams();

    if (queryParams.toString()) {
        url += '?' + queryParams.toString();
    }
    
    // Prepare request body - use methodParams if no explicit body provided
    const requestBody = body || methodParams;
    
    // Make request to NPL engine
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error('NPL engine error: ' + response.status + ' ' + response.statusText);
    }
    
    // Handle empty response body (common for state transition methods)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim() === '') {
            return { success: true, message: 'Operation completed successfully' };
        }
        return JSON.parse(text);
    } else {
        return { success: true, message: 'Operation completed successfully' };
    }
}

module.exports = {
    RfpWorkflow_getRfpDetails,
    RfpWorkflow_submitForApproval,
    RfpWorkflow_approveBudget,
    RfpWorkflow_rejectBudget,
    RfpWorkflow_activateRfp,
    RfpWorkflow_cancelRfp,
    RfpWorkflow_cancelRfpByFinance,
    RfpWorkflow_getCurrentBudget,
    RfpWorkflow_getBudgetApproval
};