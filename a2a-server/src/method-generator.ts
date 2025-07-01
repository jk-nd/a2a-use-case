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
 * Generate method handlers from OpenAPI spec
 */
export function generateMethodHandlers(openAPISpec: any, packageName: string): MethodHandlers {
    const handlers: MethodHandlers = {};
    const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
    
    // Extract protocol name from OpenAPI info
    const protocolName = openAPISpec.info?.title || packageName;
    
    // Process each path in the OpenAPI spec
    for (const [path, methods] of Object.entries(openAPISpec.paths || {})) {
        for (const [httpMethod, operation] of Object.entries(methods as any)) {
            if (httpMethod === 'get' || httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'delete') {
                const op = operation as any;
                const operationId = op.operationId;
                
                if (operationId) {
                    // Generate handler function
                    handlers[operationId] = async (params: any) => {
                        const { token, ...requestParams } = params;
                        
                        // Build request URL
                        let requestPath = path;
                        
                        // Replace path parameters with values from params
                        const pathParams = path.match(/\{([^}]+)\}/g);
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
                            method: httpMethod.toUpperCase(),
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        };
                        
                        // Add body for POST/PUT requests
                        if (httpMethod === 'post' || httpMethod === 'put') {
                            requestOptions.body = JSON.stringify(requestParams);
                        }
                        
                        // Add query parameters for GET requests
                        if (httpMethod === 'get') {
                            const queryParams = new URLSearchParams();
                            for (const [key, value] of Object.entries(requestParams)) {
                                if (value !== undefined && !path.includes(`{${key}}`)) {
                                    queryParams.append(key, String(value));
                                }
                            }
                            if (queryParams.toString()) {
                                requestPath += `?${queryParams.toString()}`;
                            }
                        }
                        
                        // Make request to NPL engine
                        const response = await fetch(`${NPL_ENGINE_URL}${requestPath}`, requestOptions);
                        
                        if (!response.ok) {
                            throw new Error(`NPL engine error: ${response.status} ${response.statusText}`);
                        }
                        
                        // Parse response
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            return await response.json();
                        } else {
                            return await response.text();
                        }
                    };
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
    
    // Extract protocol name from OpenAPI info
    const protocolName = openAPISpec.info?.title || packageName;
    
    // Process each path in the OpenAPI spec
    for (const [path, methods] of Object.entries(openAPISpec.paths || {})) {
        for (const [httpMethod, operation] of Object.entries(methods as any)) {
            if (httpMethod === 'get' || httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'delete') {
                const op = operation as any;
                const operationId = op.operationId;
                
                if (operationId) {
                    // Convert operation ID to method name
                    const methodName = operationId.toLowerCase();
                    
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
    
    // Extract protocol name from OpenAPI info
    const protocolName = openAPISpec.info?.title || packageName;
    
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