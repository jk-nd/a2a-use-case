const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Generator script to create A2A methods from NPL OpenAPI specs
 * 
 * This script:
 * 1. Fetches OpenAPI specs from NPL engine
 * 2. Generates A2A method handlers for each protocol endpoint
 * 3. Creates method mappings for dynamic routing
 * 4. Generates agent skills for each protocol
 * 5. Updates the A2A server with generated code
 */

// Configuration
const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
const NPL_TOKEN = process.env.NPL_TOKEN || '';
const OUTPUT_DIR = path.join(__dirname, 'src');

// Parse the engine URL to get hostname and port
const engineUrl = new URL(NPL_ENGINE_URL);
const ENGINE_HOST = engineUrl.hostname;
const ENGINE_PORT = engineUrl.port || (engineUrl.protocol === 'https:' ? 443 : 80);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Fetch OpenAPI specs from NPL engine
 */
async function fetchOpenAPISpecs() {
    console.log('Discovering deployed packages...');
    
    // First, discover all deployed packages
    const packages = await discoverPackages();
    console.log(`Found ${packages.length} deployed packages:`, packages);
    
    // Fetch OpenAPI specs for each package
    const allSpecs = {};
    
    for (const pkg of packages) {
        try {
            console.log(`Fetching OpenAPI spec for package: ${pkg}`);
            const spec = await fetchPackageOpenAPI(pkg);
            allSpecs[pkg] = spec;
        } catch (error) {
            console.warn(`Failed to fetch OpenAPI spec for package ${pkg}:`, error.message);
        }
    }
    
    // Merge all specs into a single OpenAPI document
    const mergedSpecs = mergeOpenAPISpecs(allSpecs);
    return mergedSpecs;
}

/**
 * Discover all deployed packages in the NPL engine
 */
async function discoverPackages() {
    try {
        // First try to get the engine OpenAPI spec (YAML format)
        const engineSpec = await fetchEngineOpenAPI();
        
        // Extract package names from the OpenAPI spec
        const packages = new Set();
        
        // Look for NPL application endpoints in the paths
        for (const [path, methods] of Object.entries(engineSpec.paths || {})) {
            // Match patterns like /npl/{package}/-/openapi.json
            const nplMatch = path.match(/\/npl\/([^\/]+)\/-\/openapi\.json/);
            if (nplMatch) {
                packages.add(nplMatch[1]);
            }
        }
        
        const discoveredPackages = Array.from(packages);
        console.log(`Discovered ${discoveredPackages.length} packages from engine spec:`, discoveredPackages);
        
        // If no packages found in engine spec, try direct package discovery
        if (discoveredPackages.length === 0) {
            console.log('No packages found in engine spec, trying direct package discovery...');
            return await discoverPackagesDirect();
        }
        
        return discoveredPackages;
    } catch (error) {
        console.warn('Failed to discover packages from engine spec:', error.message);
        console.log('Trying direct package discovery...');
        return await discoverPackagesDirect();
    }
}

/**
 * Fetch engine OpenAPI spec (YAML format)
 */
async function fetchEngineOpenAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: ENGINE_HOST,
            port: ENGINE_PORT,
            path: '/openapi/engine.yml',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NPL_TOKEN}`,
                'Accept': 'application/json, application/yaml, text/yaml'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    // Try to parse as JSON first
                    const specs = JSON.parse(data);
                    resolve(specs);
                } catch (jsonError) {
                    // If JSON fails, try to parse as YAML
                    try {
                        const yaml = require('js-yaml');
                        const specs = yaml.load(data);
                        resolve(specs);
                    } catch (yamlError) {
                        reject(new Error(`Failed to parse engine specs (JSON: ${jsonError.message}, YAML: ${yamlError.message})`));
                    }
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Direct package discovery by checking known packages
 */
async function discoverPackagesDirect() {
    const knownPackages = ['rfp_workflow', 'test_deploy'];
    const availablePackages = [];
    
    for (const pkg of knownPackages) {
        try {
            console.log(`Checking if package ${pkg} is available...`);
            const response = await fetchPackageOpenAPI(pkg);
            if (response && response.paths) {
                availablePackages.push(pkg);
                console.log(`Package ${pkg} is available`);
            }
        } catch (error) {
            console.log(`Package ${pkg} is not available:`, error.message);
        }
    }
    
    console.log(`Direct discovery found ${availablePackages.length} packages:`, availablePackages);
    return availablePackages;
}

/**
 * Fetch OpenAPI spec for a specific package
 */
async function fetchPackageOpenAPI(packageName) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: ENGINE_HOST,
            port: ENGINE_PORT,
            path: `/npl/${packageName}/-/openapi.json`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NPL_TOKEN}`,
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const specs = JSON.parse(data);
                        resolve(specs);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse OpenAPI specs for ${packageName}: ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Merge multiple OpenAPI specs into a single document
 */
function mergeOpenAPISpecs(specsByPackage) {
    const merged = {
        openapi: '3.0.1',
        info: {
            title: 'NPL Engine - All Packages',
            description: 'Combined OpenAPI spec for all deployed NPL packages',
            version: '1.0.0'
        },
        paths: {},
        components: {
            schemas: {},
            securitySchemes: {}
        }
    };
    
    // Merge paths from all packages
    for (const [packageName, spec] of Object.entries(specsByPackage)) {
        if (spec.paths) {
            for (const [path, methods] of Object.entries(spec.paths)) {
                merged.paths[path] = methods;
            }
        }
        
        // Merge components if they exist
        if (spec.components) {
            if (spec.components.schemas) {
                Object.assign(merged.components.schemas, spec.components.schemas);
            }
            if (spec.components.securitySchemes) {
                Object.assign(merged.components.securitySchemes, spec.components.securitySchemes);
            }
        }
    }
    
    return merged;
}

/**
 * Generate A2A method handler for a protocol endpoint
 */
function generateMethodHandler(protocolName, endpoint, method) {
    const operationId = endpoint.operationId || `${method.toLowerCase()}_${protocolName}`;
    const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    const bodyParam = endpoint.requestBody;
    
    const paramNames = [
        ...pathParams.map(p => p.name),
        ...queryParams.map(p => p.name),
        ...(bodyParam ? ['body'] : [])
    ];

    const pathParamReplacements = pathParams.map(p => `    url = url.replace('{${p.name}}', params.${p.name});`).join('\n');
    const queryParamChecks = queryParams.map(p => `    if (query?.${p.name}) queryParams.append('${p.name}', query.${p.name});`).join('\n');

    return `
/**
 * Generated A2A method handler for ${protocolName} - ${endpoint.summary || operationId}
 * @param {Object} params - Method parameters
 * @param {string} params.protocolId - Protocol instance ID
 * @param {Object} params.body - Request body (if applicable)
 * @param {Object} params.query - Query parameters (if applicable)
 * @param {string} params.token - JWT token for authentication
 * @returns {Promise<Object>} Response from NPL engine
 */
async function ${operationId}(params) {
    const { protocolId, body, query, token, ...methodParams } = params;
    
    // Build URL with path parameters
    let url = process.env.NPL_ENGINE_URL + '${endpoint.path}';
    
    // Replace {id} with protocolId (common pattern for NPL protocols)
    url = url.replace('{id}', protocolId);
${pathParamReplacements}
    
    // Add query parameters
    const queryParams = new URLSearchParams();
${queryParamChecks}
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
}`;
}

/**
 * Generate method mapping for dynamic routing
 */
function generateMethodMapping(protocols) {
    const mappings = [];
    
    for (const [packageName, packageProtocols] of Object.entries(protocols)) {
        for (const [protocolName, methods] of Object.entries(packageProtocols)) {
            // Add discovery methods for each protocol
            mappings.push({
                package: packageName,
                protocol: protocolName,
                method: 'listmyprotocols',
                operationId: `${packageName}_${protocolName}_listMyProtocols`,
                path: `/npl/${packageName}/${protocolName}/`,
                summary: `List all protocol instances for ${packageName}.${protocolName}`
            });
            
            mappings.push({
                package: packageName,
                protocol: protocolName,
                method: 'getmyprotocolcontent',
                operationId: `${packageName}_${protocolName}_getMyProtocolContent`,
                path: `/npl/${packageName}/${protocolName}/{id}/`,
                summary: `Get protocol content for ${packageName}.${protocolName}`
            });
            
            // Add regular protocol methods
            for (const [methodName, endpoint] of Object.entries(methods)) {
                const operationId = endpoint.operationId || `${methodName.toLowerCase()}_${packageName}_${protocolName}`;
                mappings.push({
                    package: packageName,
                    protocol: protocolName,
                    method: methodName.toLowerCase(),
                    operationId,
                    path: endpoint.path,
                    summary: endpoint.summary || operationId
                });
            }
        }
    }
    
    return `
/**
 * Generated method mappings for NPL protocols
 * Maps A2A method calls to NPL engine endpoints
 */
const METHOD_MAPPINGS = ${JSON.stringify(mappings, null, 2)};

/**
 * Find method mapping by package, protocol and method
 */
function findMethodMapping(package, protocol, method) {
    return METHOD_MAPPINGS.find(m => 
        m.package === package && m.protocol === protocol && m.method === method.toLowerCase()
    );
}

module.exports = { METHOD_MAPPINGS, findMethodMapping };
`;
}

/**
 * Generate agent skills for each protocol
 */
function generateAgentSkills(protocols) {
    const skills = [];
    
    for (const [packageName, packageProtocols] of Object.entries(protocols)) {
        for (const [protocolName, methods] of Object.entries(packageProtocols)) {
            const protocolMethods = [
                // Add discovery methods first
                {
                    name: 'listmyprotocols',
                    description: `List all protocol instances where the authenticated party is involved in ${packageName}.${protocolName}`
                },
                {
                    name: 'getmyprotocolcontent',
                    description: `Get full content of a specific protocol instance for ${packageName}.${protocolName}`
                },
                // Add regular protocol methods
                ...Object.keys(methods).map(methodName => ({
                    name: methodName.toLowerCase(),
                    description: methods[methodName].summary || `${methodName} operation for ${packageName}.${protocolName}`
                }))
            ];
            
            const protocolSkills = {
                package: packageName,
                protocol: protocolName,
                methods: protocolMethods
            };
            skills.push(protocolSkills);
        }
    }
    
    return `
/**
 * Generated agent skills for NPL protocols
 * Defines available methods for each protocol
 */
const AGENT_SKILLS = ${JSON.stringify(skills, null, 2)};

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
`;
}

/**
 * Generate main A2A server with NPL integration and Google A2A SDK support
 */
function generateA2AServer(protocols) {
    const methodHandlers = [];
    const methodNames = [];
    const discoveryMethodNames = [];
    
    for (const [packageName, packageProtocols] of Object.entries(protocols)) {
        for (const [protocolName, methods] of Object.entries(packageProtocols)) {
            // Add discovery method names
            discoveryMethodNames.push(`${packageName}_${protocolName}_listMyProtocols`);
            discoveryMethodNames.push(`${packageName}_${protocolName}_getMyProtocolContent`);
            
            // Add regular protocol methods
            for (const [methodName, endpoint] of Object.entries(methods)) {
                const operationId = endpoint.operationId || `${methodName.toLowerCase()}_${packageName}_${protocolName}`;
                methodHandlers.push(generateMethodHandler(`${packageName}_${protocolName}`, endpoint, methodName));
                methodNames.push(operationId);
            }
        }
    }

    // Build import lines for method handlers
    const importLines = methodNames.map(name => `const { ${name} } = require('./method-handlers');`).join('\n');
    // Build switch cases for executeMethod
    const switchCases = methodNames.map(name => `        case '${name}':\n            return await ${name}(params);`).join('\n');

    return [
        "const express = require('express');",
        "const cors = require('cors');",
        "const jwt = require('jsonwebtoken');",
        "const { findMethodMapping } = require('./method-mappings');",
        "const { getProtocolSkills, getAllProtocols } = require('./agent-skills');",
        '',
        '// Import generated method handlers',
        importLines,
        '',
        'const app = express();',
        'const PORT = process.env.PORT || 3000;',
        '',
        '// Configuration',
        "const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://npl-engine:12000';",
        '',
        '// Middleware',
        'app.use(cors());',
        'app.use(express.json());',
        '',
        '/**',
        ' * Validate JWT token from multiple IdPs',
        ' */',
        'function validateToken(token) {',
        '    if (!token) {',
        "        throw new Error('No token provided');",
        '    }',
        '',
        '    try {',
        '        // Decode token to get issuer',
        '        const decoded = jwt.decode(token);',
        '        if (!decoded || !decoded.iss) {',
        "            throw new Error('Invalid token format');",
        '        }',
        '',
        '        // Validate based on issuer (IdP)',
        '        // In production, you would validate against each IdP\'s public keys',
        '        const trustedIssuers = [',
        "            'http://localhost:11000/realms/noumena', // Main Keycloak (localhost)",
        "            'http://keycloak:11000/realms/noumena', // Main Keycloak (Docker service)",
        "            'http://localhost:8081/realms/procurement', // Procurement Keycloak",
        "            'http://localhost:8082/realms/finance' // Finance Keycloak",
        '        ];',
        '',
        '        if (!trustedIssuers.includes(decoded.iss)) {',
        '            throw new Error(`Untrusted issuer: ${decoded.iss}`);',
        '        }',
        '',
        '        return decoded;',
        '    } catch (error) {',
        '        throw new Error(`Token validation failed: ${error.message}`);',
        '    }',
        '}',
        '',
        '/**',
        ' * Handle listMyProtocols discovery method',
        ' */',
        'async function handleListMyProtocols(params, token, res) {',
        '    try {',
        '        const { package, protocol } = params;',
        '        ',
        '        if (!package || !protocol) {',
        '            return res.status(400).json({',
        "                error: 'Missing required parameters: package, protocol'",
        '            });',
        '        }',
        '',
        '        // Query NPL engine with agent\'s token',
        '        const nplResponse = await fetch(',
        '            `${NPL_ENGINE_URL}/npl/${package}/${protocol}/`,',
        '            {',
        '                headers: {',
        '                    \'Authorization\': `Bearer ${token}`,',
        '                    \'Accept\': \'application/json\'',
        '                }',
        '            }',
        '        );',
        '',
        '        if (!nplResponse.ok) {',
        '            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText}`);',
        '        }',
        '',
        '        const protocols = await nplResponse.json();',
        '',
        '        res.json({',
        '            success: true,',
        '            result: {',
        '                protocols: protocols,',
        '                count: protocols.length,',
        '                package: package,',
        '                protocol: protocol',
        '            },',
        '            method: `${package}.${protocol}.listMyProtocols`,',
        '            handler: \'npl-engine\',',
        '            timestamp: new Date().toISOString()',
        '        });',
        '',
        '    } catch (error) {',
        "        console.error('listMyProtocols error:', error);",
        '        res.status(500).json({',
        '            error: error.message,',
        '            timestamp: new Date().toISOString()',
        '        });',
        '    }',
        '}',
        '',
        '/**',
        ' * Handle getMyProtocolContent discovery method',
        ' */',
        'async function handleGetMyProtocolContent(params, token, res) {',
        '    try {',
        '        const { protocolId, package, protocol } = params;',
        '        ',
        '        if (!protocolId || !package || !protocol) {',
        '            return res.status(400).json({',
        "                error: 'Missing required parameters: protocolId, package, protocol'",
        '            });',
        '        }',
        '',
        '        // Query NPL engine with agent\'s token',
        '        const nplResponse = await fetch(',
        '            `${NPL_ENGINE_URL}/npl/${package}/${protocol}/${protocolId}/`,',
        '            {',
        '                headers: {',
        '                    \'Authorization\': `Bearer ${token}`,',
        '                    \'Accept\': \'application/json\'',
        '                }',
        '            }',
        '        );',
        '',
        '        if (!nplResponse.ok) {',
        '            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText}`);',
        '        }',
        '',
        '        const protocolContent = await nplResponse.json();',
        '',
        '        res.json({',
        '            success: true,',
        '            result: {',
        '                protocolId: protocolId,',
        '                content: protocolContent',
        '            },',
        '            method: `${package}.${protocol}.getMyProtocolContent`,',
        '            handler: \'npl-engine\',',
        '            timestamp: new Date().toISOString()',
        '        });',
        '',
        '    } catch (error) {',
        "        console.error('getMyProtocolContent error:', error);",
        '        res.status(500).json({',
        '            error: error.message,',
        '            timestamp: new Date().toISOString()',
        '        });',
        '    }',
        '}',
        '',
        '/**',
        ' * A2A method execution endpoint (NPL Integration)',
        ' */',
        "app.post('/a2a/method', async (req, res) => {",
        '    try {',
        '        const { package, protocol, method, params = {}, token } = req.body;',
        '',
        '        if (!package || !protocol || !method || !token) {',
        '            return res.status(400).json({',
        "                error: 'Missing required parameters: package, protocol, method, token'",
        '            });',
        '        }',
        '',
        '        // Validate token at A2A level',
        '        const claims = validateToken(token);',
        '',
        '        // Handle discovery methods',
        '        if (method === \'listMyProtocols\') {',
        '            return await handleListMyProtocols(params, token, res);',
        '        }',
        '        ',
        '        if (method === \'getMyProtocolContent\') {',
        '            return await handleGetMyProtocolContent(params, token, res);',
        '        }',
        '',
        '        // Handle with NPL engine',
        '        console.log(`Routing to NPL engine: ${package}.${protocol}.${method}`);',
        '        const mapping = findMethodMapping(package, protocol, method);',
        '        if (!mapping) {',
        '            return res.status(404).json({',
        '                error: `Method ${method} not found for ${package}.${protocol}`',
        '            });',
        '        }',
        '        const result = await executeMethod(mapping.operationId, {',
        '            ...params,',
        '            token',
        '        });',
        '',
        '        res.json({',
        '            success: true,',
        '            result,',
        '            method: `${package}.${protocol}.${method}`,',
        '            handler: \'npl-engine\',',
        '            timestamp: new Date().toISOString()',
        '        });',
        '',
        '    } catch (error) {',
        "        console.error('A2A method execution error:', error);",
        '        res.status(500).json({',
        '            error: error.message,',
        '            timestamp: new Date().toISOString()',
        '        });',
        '    }',
        '});',
        '',
        '/**',
        ' * Execute NPL method by name',
        ' */',
        'async function executeMethod(methodName, params) {',
        '    switch (methodName) {',
        switchCases,
        '        default:',
        '            throw new Error(`Unknown method: ${methodName}`);',
        '    }',
        '}',
        '',
        '/**',
        ' * Get available protocols and methods',
        ' */',
        "app.get('/a2a/skills', (req, res) => {",
        '    try {',
        '        const nplProtocols = getAllProtocols();',
        '        const nplSkills = nplProtocols.map(protocol => getProtocolSkills(protocol.package, protocol.protocol));',
        '',
        '        res.json({',
        '            protocols: nplProtocols.map(p => ({ package: p.package, protocol: p.protocol })),',
        '            skills: nplSkills,',
        '            handlers: {',
        '                npl: nplProtocols.map(p => ({ package: p.package, protocol: p.protocol }))',
        '            },',
        '            timestamp: new Date().toISOString()',
        '        });',
        '    } catch (error) {',
        '        res.status(500).json({',
        '            error: error.message,',
        '            timestamp: new Date().toISOString()',
        '        });',
        '    }',
        '});',
        '',
        '/**',
        ' * Health check endpoint',
        ' */',
        "app.get('/health', (req, res) => {",
        '    res.json({',
        "        status: 'healthy',",
        "        service: 'A2A Server (NPL Integration)',",
        '        npl_integration: true,',
        '        timestamp: new Date().toISOString()',
        '    });',
        '});',
        '',
        '// Start server',
        'app.listen(PORT, () => {',
        '    console.log("A2A Server (NPL Integration) running on port " + PORT);',
        '    console.log("NPL Integration: Enabled");',
        '    console.log("Available protocols: " + getAllProtocols().map(p => `${p.package}.${p.protocol}`).join(", "));',
        '});',
        '',
        'module.exports = app;',
    ].join('\n');
}

/**
 * Main generation function
 */
async function generateA2AMethods() {
    try {
        console.log('Fetching NPL OpenAPI specs...');
        const specs = await fetchOpenAPISpecs();
        
        console.log('Parsing protocols...');
        const protocols = {};
        
        // Extract protocol endpoints from OpenAPI paths
        for (const [path, methods] of Object.entries(specs.paths)) {
            // Look for NPL protocol paths (e.g., /npl/rfp_workflow/RfpWorkflow/{id}/methodName)
            const nplMatch = path.match(/\/npl\/([^\/]+)\/([^\/]+)\/\{id\}\/(.+)/);
            if (nplMatch) {
                const packageName = nplMatch[1];
                const protocolName = nplMatch[2];
                const methodName = nplMatch[3];
                
                if (!protocols[packageName]) {
                    protocols[packageName] = {};
                }
                
                if (!protocols[packageName][protocolName]) {
                    protocols[packageName][protocolName] = {};
                }
                
                // Add each HTTP method for this endpoint
                for (const [method, details] of Object.entries(methods)) {
                    protocols[packageName][protocolName][methodName] = {
                        ...details,
                        path: path,
                        operationId: details.operationId || `${method}_${packageName}_${protocolName}_${methodName}`
                    };
                }
            }
        }
        
        console.log('Found ' + Object.keys(protocols).length + ' protocols');
        
        // Generate files
        console.log('Generating method handlers...');
        const methodHandlersContent = Object.entries(protocols)
            .map(([packageName, packageProtocols]) => 
                Object.entries(packageProtocols)
                    .map(([protocolName, methods]) => 
                        Object.entries(methods)
                            .map(([methodName, endpoint]) => 
                                generateMethodHandler(`${packageName}_${protocolName}`, endpoint, methodName)
                            ).join('\n\n')
                    ).join('\n\n')
            ).join('\n\n');
        
        // Add module.exports for all handler functions
        const methodNames = [];
        for (const [packageName, packageProtocols] of Object.entries(protocols)) {
            for (const [protocolName, methods] of Object.entries(packageProtocols)) {
                for (const [methodName, endpoint] of Object.entries(methods)) {
                    const operationId = endpoint.operationId || `${methodName.toLowerCase()}_${packageName}_${protocolName}`;
                    methodNames.push(operationId);
                }
            }
        }
        
        const exportsContent = `\n\nmodule.exports = {\n    ${methodNames.join(',\n    ')}\n};`;
        
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'method-handlers.js'),
            methodHandlersContent + exportsContent
        );
        
        console.log('Generating method mappings...');
        const mappingsContent = generateMethodMapping(protocols);
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'method-mappings.js'),
            mappingsContent
        );
        
        console.log('Generating agent skills...');
        const skillsContent = generateAgentSkills(protocols);
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'agent-skills.js'),
            skillsContent
        );
        
        console.log('Generating A2A server...');
        const serverContent = generateA2AServer(protocols);
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'server.js'),
            serverContent
        );
        
        console.log('Generation complete!');
        console.log('Generated files:');
        console.log('- src/method-handlers.js');
        console.log('- src/method-mappings.js');
        console.log('- src/agent-skills.js');
        console.log('- src/server.js');
        
    } catch (error) {
        console.error('Generation failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateA2AMethods();
}

module.exports = { generateA2AMethods }; 