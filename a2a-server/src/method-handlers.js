
/**
 * Generated A2A method handler for test_deploy_TestProtocol - TestProtocol_startProcessing
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function TestProtocol_startProcessing(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/test_deploy/TestProtocol/{id}/startProcessing';
    
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
 * Generated A2A method handler for test_deploy_TestProtocol - TestProtocol_updateValue
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function TestProtocol_updateValue(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/test_deploy/TestProtocol/{id}/updateValue';
    
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
 * Generated A2A method handler for test_deploy_TestProtocol - TestProtocol_complete
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function TestProtocol_complete(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/test_deploy/TestProtocol/{id}/complete';
    
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
 * Generated A2A method handler for test_deploy_TestProtocol - TestProtocol_fail
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function TestProtocol_fail(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/test_deploy/TestProtocol/{id}/fail';
    
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
 * Generated A2A method handler for test_deploy_TestProtocol - TestProtocol_getProcessingTime
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function TestProtocol_getProcessingTime(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '/npl/test_deploy/TestProtocol/{id}/getProcessingTime';
    
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
    TestProtocol_startProcessing,
    TestProtocol_updateValue,
    TestProtocol_complete,
    TestProtocol_fail,
    TestProtocol_getProcessingTime
};