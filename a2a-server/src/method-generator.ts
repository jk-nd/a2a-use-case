/**
 * Method generator for NPL protocols
 * Generates A2A method handlers, mappings, and agent skills from OpenAPI specs
 */

interface MethodMapping {
    package: string;
    protocol: string;
    method: string;
    operationId: string;
    path: string;
    summary: string;
}

interface MethodHandlers {
    [operationId: string]: (params: any) => Promise<any>;
}

interface ProtocolInfo {
    package: string;
    protocol: string;
    methods: Array<{
        name: string;
        description: string;
    }>;
}

/**
 * Extract protocol name from OpenAPI paths
 * The NPL engine uses paths like /npl/{package}/{protocol}/...
 */
function extractProtocolNameFromPaths(openAPISpec: any, packageName: string): string {
    const paths = Object.keys(openAPISpec.paths || {});
    
    // Look for paths that match the pattern /npl/{package}/{protocol}/
    // Exclude the OpenAPI spec path which is /npl/{package}/-/openapi.json
    for (const path of paths) {
        // Skip the OpenAPI spec path
        if (path.includes('/-/openapi.json')) {
            continue;
        }
        
        const match = path.match(new RegExp(`^/npl/${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/]+)/`));
        if (match) {
            return match[1]; // Return the protocol name
        }
    }
    
    // Fallback to package name if no protocol found
    return packageName;
}

/**
 * Generate method handlers from OpenAPI spec
 */
export function generateMethodHandlers(openAPISpec: any, packageName: string): MethodHandlers {
    const handlers: MethodHandlers = {};
    
    // Extract protocol name from OpenAPI paths
    const protocolName = extractProtocolNameFromPaths(openAPISpec, packageName);
    
    // Process each path in the OpenAPI spec
    for (const [path, methods] of Object.entries(openAPISpec.paths || {})) {
        for (const [httpMethod, operation] of Object.entries(methods as any)) {
            if (httpMethod === 'get' || httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'delete') {
                const op = operation as any;
                const operationId = op.operationId;
                
                if (operationId) {
                    // Create a self-contained handler function that captures all needed values
                    const createHandler = (capturedPath: string, capturedHttpMethod: string) => {
                        return async (params: any) => {
                            const { token, ...requestParams } = params;
                            
                            // Build request URL
                            let requestPath = capturedPath;
                            
                            // Replace path parameters with values from params
                            const pathParams = capturedPath.match(/\{([^}]+)\}/g);
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
                            const requestOptions: any = {
                                method: capturedHttpMethod.toUpperCase(),
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            };
                            
                            // Add body for POST/PUT requests
                            if (capturedHttpMethod === 'post' || capturedHttpMethod === 'put') {
                                requestOptions.body = JSON.stringify(requestParams);
                            }
                            
                            // Add query parameters for GET requests
                            if (capturedHttpMethod === 'get') {
                                const queryParams = new URLSearchParams();
                                for (const [key, value] of Object.entries(requestParams)) {
                                    if (value !== undefined && !capturedPath.includes(`{${key}}`)) {
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
                                    throw new Error(`NPL engine error: ${(responseData as any).error}`);
                                } else if (responseData && typeof responseData === 'string') {
                                    throw new Error(`NPL engine error: ${responseData}`);
                                } else {
                                    throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                                }
                            }
                            
                            return responseData;
                        };
                    };
                    
                    handlers[operationId] = createHandler(path, httpMethod);
                }
            }
        }
    }
    
    return handlers;
}

/**
 * Generate method mappings from OpenAPI spec
 */
export function generateMethodMappings(openAPISpec: any, packageName: string): MethodMapping[] {
    const mappings: MethodMapping[] = [];
    
    // Extract protocol name from OpenAPI paths
    const protocolName = extractProtocolNameFromPaths(openAPISpec, packageName);
    
    // Process each path in the OpenAPI spec
    for (const [path, methods] of Object.entries(openAPISpec.paths || {})) {
        for (const [httpMethod, operation] of Object.entries(methods as any)) {
            if (httpMethod === 'get' || httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'delete') {
                const op = operation as any;
                const operationId = op.operationId;
                
                if (operationId) {
                    // Convert operation ID to method name
                    let methodName = operationId.toLowerCase();
                    // If operationId starts with protocolName + '_', strip it
                    if (operationId.startsWith(protocolName + '_')) {
                        methodName = operationId.substring(protocolName.length + 1).toLowerCase();
                    }
                    mappings.push({
                        package: packageName,
                        protocol: protocolName,
                        method: methodName,
                        operationId: operationId,
                        path: path,
                        summary: op.summary || op.description || `${methodName} operation for ${packageName}.${protocolName}`
                    });
                }
            }
        }
    }
    
    return mappings;
}

/**
 * Generate agent skills from OpenAPI spec
 */
export function generateAgentSkills(openAPISpec: any, packageName: string): ProtocolInfo[] {
    const skills: ProtocolInfo[] = [];
    
    // Extract protocol name from OpenAPI paths
    const protocolName = extractProtocolNameFromPaths(openAPISpec, packageName);
    
    const methods: Array<{ name: string; description: string }> = [];
    
    // Process each path in the OpenAPI spec
    for (const [path, methodsObj] of Object.entries(openAPISpec.paths || {})) {
        for (const [httpMethod, operation] of Object.entries(methodsObj as any)) {
            if (httpMethod === 'get' || httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'delete') {
                const op = operation as any;
                const operationId = op.operationId;
                
                if (operationId) {
                    // Convert operation ID to method name
                    const methodName = operationId.toLowerCase();
                    
                    methods.push({
                        name: methodName,
                        description: op.summary || op.description || `${methodName} operation for ${packageName}.${protocolName}`
                    });
                }
            }
        }
    }
    
    skills.push({
        package: packageName,
        protocol: protocolName,
        methods: methods
    });
    
    return skills;
} 