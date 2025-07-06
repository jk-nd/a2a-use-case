
/**
 * Generated method handlers for NPL protocols
 * Each handler is a function that executes the corresponding NPL operation
 */
module.exports = {
  "_getOpenAPI": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/-/openapi.json';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('get' === 'post' || 'get' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('get' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "_getOrderCommitmentList": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('get' === 'post' || 'get' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('get' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "_createOrderCommitment": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "_getOrderCommitmentByID": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('get' === 'post' || 'get' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('get' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_commitToPay": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/commitToPay';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_commitToDeliver": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/commitToDeliver';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_markDelivered": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/markDelivered';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_pay": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/pay';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_complete": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/complete';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_cancel": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/cancel';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_getStatus": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/getStatus';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_getTotalAmount": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/getTotalAmount';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_getOrderDetails": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/getOrderDetails';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_isOrderAgentCommitted": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/isOrderAgentCommitted';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        },
  "OrderCommitment_isSupplierAgentCommitted": async (params) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = '/npl/payment_workflow/OrderCommitment/{id}/isSupplierAgentCommitted';
                            
                            // Replace path parameters with values from params
                            const pathParams = requestPath.match(/\{([^}]+)\}/g);
                            if (pathParams) {
                                for (const param of pathParams) {
                                    const paramName = param.slice(1, -1);
                                    const paramValue = requestParams[paramName];
                                    if (paramValue !== undefined) {
                                        requestPath = requestPath.replace(param, paramValue);
                                    }
                                }
                            }
                            
                            // Prepare request options
                            const requestOptions = {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if ('post' === 'post' || 'post' === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if ('post' === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !requestPath.includes(`{${key}}`)) {
                                        queryParams.append(key, String(value));
                                    }
                                }
                                if (queryParams.toString()) {
                                    requestPath += `?${queryParams.toString()}`;
                                }
                            }
                            
                            // Make request to NPL engine
                            const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
                            const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                            
                            // Get response text first to handle empty responses
                            const responseText = await response.text();
                            let responseData;
                            
                            // Try to parse as JSON if we have content
                            if (responseText && responseText.trim()) {
                                try {
                                    responseData = JSON.parse(responseText);
                                } catch (error) {
                                    // If JSON parsing fails, use the text as is
                                    responseData = responseText;
                                }
                            }
                            
                            // Check if response indicates an error
                            if (!response.ok) {
                                // If we have JSON error data, use it
                                if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                                    throw new Error(`NPL engine error: ${responseData.error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        }
};
