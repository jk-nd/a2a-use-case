import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Load environment variables
dotenv.config();

// Import A2A types
import { 
  AgentCard, 
  AgentSkill, 
  AgentCapabilities, 
  JSONRPCRequest, 
  JSONRPCResponse,
  JSONRPCErrorResponse,
  JSONRPCSuccessResponse,
  InternalError
} from './types';

// Import dynamic method manager
import { dynamicMethodManager } from './dynamic-method-manager';

// Import token manager
import { tokenManager } from './token-manager';

// Import agent communication components
import { AgentRegistry } from './agent-registry';
import { AgentCommunication } from './agent-communication';
import { AgentEndpoints } from './agent-endpoints';

// Import generated agent skills (for /a2a/skills endpoint)
let getProtocolSkills: any, getAllProtocols: any;

/**
 * Reload the agent skills module to pick up changes
 */
function reloadAgentSkills() {
    try {
        // Clear the require cache for the agent-skills module
        delete require.cache[require.resolve('./agent-skills')];
        
        // Reload the module
        const agentSkillsModule = require('./agent-skills');
        getProtocolSkills = agentSkillsModule.getProtocolSkills;
        getAllProtocols = agentSkillsModule.getAllProtocols;
        
        console.log('✅ Agent skills module reloaded successfully');
        return true;
    } catch (error) {
        console.log('Agent skills module not found, will be generated dynamically');
        getProtocolSkills = () => [];
        getAllProtocols = () => [];
        return false;
    }
}

// Initial load
reloadAgentSkills();

// Initialize agent communication system
const agentRegistry = new AgentRegistry();
const agentCommunication = new AgentCommunication(agentRegistry);
const agentEndpoints = new AgentEndpoints(agentRegistry, agentCommunication);

const app = express();
const PORT = process.env.PORT || 8000;

// Configuration
const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
const NPL_MANAGEMENT_URL = process.env.NPL_MANAGEMENT_URL || 'http://127.0.0.1:12400';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:11000';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'noumena';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'noumena';

// Middleware
app.use(cors());
app.use(express.json());

// Mount agent communication endpoints
app.use('/agents', agentEndpoints.getRouter());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Validate JWT token from multiple IdPs
 */
function validateToken(token: string) {
    if (!token) {
        throw new Error('No token provided');
    }

    try {
        // Decode token to get issuer
        const decoded = jwt.decode(token) as any;
        if (!decoded || !decoded.iss) {
            throw new Error('Invalid token format');
        }

        // Validate based on issuer (IdP)
        // In production, you would validate against each IdP's public keys
        const trustedIssuers = [
            'http://localhost:11000/realms/noumena', // Main Keycloak
            'http://keycloak:11000/realms/noumena', // Main Keycloak (Docker service)
            'http://localhost:8081/realms/procurement', // Procurement Keycloak
            'http://localhost:8082/realms/finance' // Finance Keycloak
        ];

        if (!trustedIssuers.includes(decoded.iss)) {
            throw new Error(`Untrusted issuer: ${decoded.iss}`);
        }

        return decoded;
    } catch (error: any) {
        throw new Error(`Token validation failed: ${error.message}`);
    }
}

/**
 * Handle listMyProtocols discovery method
 */
async function handleListMyProtocols(params: any, token: string, res: Response): Promise<void> {
    try {
        const { package: pkg, protocol } = params;
        
        if (!pkg || !protocol) {
            res.status(400).json({
                error: 'Missing required parameters: package, protocol'
            });
            return;
        }

        // Query NPL engine with agent's token
        const nplResponse = await fetch(
            `${NPL_ENGINE_URL}/npl/${pkg}/${protocol}/`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!nplResponse.ok) {
            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText}`);
        }

        const nplData = await nplResponse.json() as { items?: any[]; page?: number };
        
        // NPL engine returns { items: [...], page: 1 }
        // Extract the items array for the response
        const protocols = nplData.items || [];

        res.json({
            success: true,
            result: {
                protocols: protocols,
                count: protocols.length,
                package: pkg,
                protocol: protocol
            },
            method: `${pkg}.${protocol}.listMyProtocols`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('listMyProtocols error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle getMyProtocolContent discovery method
 */
async function handleGetMyProtocolContent(params: any, token: string, res: Response): Promise<void> {
    try {
        const { protocolId, package: pkg, protocol } = params;
        
        if (!protocolId || !pkg || !protocol) {
            res.status(400).json({
                error: 'Missing required parameters: protocolId, package, protocol'
            });
            return;
        }

        // Query NPL engine with agent's token
        const nplResponse = await fetch(
            `${NPL_ENGINE_URL}/npl/${pkg}/${protocol}/${protocolId}/`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!nplResponse.ok) {
            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText}`);
        }

        const protocolContent = await nplResponse.json();

        res.json({
            success: true,
            result: {
                protocolId: protocolId,
                content: protocolContent
            },
            method: `${pkg}.${protocol}.getMyProtocolContent`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('getMyProtocolContent error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Execute NPL method by name using dynamic loading
 */
async function executeMethod(methodName: string, params: any) {
    // Get the method handler from the dynamic method manager
    const methodHandlers = require('./method-handlers');
    const handler = methodHandlers[methodName];
    
    if (!handler) {
        throw new Error(`Unknown method: ${methodName}`);
    }
    
    return await handler(params);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'A2A Server (NPL Integration)',
    npl_integration: true,
    protocol_deployment: true,
    protocol_instantiation: true,
    event_stream: dynamicMethodManager.getStatus(),
    deployment_endpoints: [
      'POST /a2a/deploy',
      'POST /a2a/refresh', 
      'GET /a2a/protocols',
      'POST /a2a/instantiate'
    ],
    timestamp: new Date().toISOString()
  });
});

// Event stream status endpoint
app.get('/a2a/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    result: dynamicMethodManager.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// A2A method execution endpoint (NPL Integration)
app.post('/a2a/method', async (req: Request, res: Response): Promise<void> => {
    try {
        const { package: pkg, protocol, method, params = {}, token } = req.body;

        if (!pkg || !protocol || !method || !token) {
            res.status(400).json({
                error: 'Missing required parameters: package, protocol, method, token'
            });
            return;
        }

        // Validate token at A2A level
        const claims = validateToken(token);

        // Handle discovery methods
        if (method === 'listMyProtocols') {
            await handleListMyProtocols(params, token, res);
            return;
        }
        
        if (method === 'getMyProtocolContent') {
            await handleGetMyProtocolContent(params, token, res);
            return;
        }

        // Handle with NPL engine using dynamic loading
        console.log(`Routing to NPL engine: ${pkg}.${protocol}.${method}`);
        const mapping = dynamicMethodManager.findMethodMapping(pkg, protocol, method);
        console.log(`DEBUG: Looking for method ${method} in ${pkg}.${protocol}`);
        console.log(`DEBUG: Found mapping:`, mapping);
        if (!mapping) {
            console.log(`DEBUG: Available mappings for ${pkg}.${protocol}:`, dynamicMethodManager.getAllMappings().filter(m => m.package === pkg && m.protocol === protocol));
            res.status(404).json({
                error: `Method ${method} not found for ${pkg}.${protocol}`
            });
            return;
        }
        const result = await executeMethod(mapping.operationId, {
            ...params,
            token
        });

        res.json({
            success: true,
            result,
            method: `${pkg}.${protocol}.${method}`,
            handler: 'npl-engine',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('A2A method execution error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get available protocols and methods
app.get('/a2a/skills', (req: Request, res: Response) => {
    try {
        // Reload agent skills to pick up any dynamic updates
        reloadAgentSkills();
        
        const nplProtocols = getAllProtocols();
        const nplSkills = nplProtocols.map((protocol: any) => getProtocolSkills(protocol.package, protocol.protocol));

        res.json({
            protocols: nplProtocols.map((p: any) => ({ package: p.package, protocol: p.protocol })),
            skills: nplSkills,
            handlers: {
                npl: nplProtocols.map((p: any) => ({ package: p.package, protocol: p.protocol }))
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Legacy A2A Request endpoint (for backward compatibility)
app.post('/a2a/request', async (req: Request, res: Response) => {
  try {
    const request: JSONRPCRequest = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    
    console.log('Received legacy A2A request:', {
      id: request.id,
      method: request.method,
      agentId: request.params?.agent_id
    });
    
    // Try to map legacy request to new format
    const methodParts = request.method.split('.');
    if (methodParts.length >= 2) {
      const pkg = methodParts[0];
      const protocol = methodParts[1];
      const method = methodParts[2] || 'default';
      
      const mapping = dynamicMethodManager.findMethodMapping(pkg, protocol, method);
      if (mapping) {
        const result = await executeMethod(mapping.operationId, {
          ...request.params,
          token
        });
        
        const response: JSONRPCSuccessResponse = {
          jsonrpc: '2.0',
          id: request.id || null,
          result: result
        };
        res.json(response);
        return;
      }
    }
    
    // Fallback to error response
    const response: JSONRPCErrorResponse = {
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32601,
        message: `Method ${request.method} not found`
      }
    };
    res.json(response);
    
  } catch (error: any) {
    console.error('Error handling legacy A2A request:', error);
    
    const response: JSONRPCErrorResponse = {
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
    
    res.json(response);
  }
});

/**
 * Deploy a new NPL protocol to the engine
 * This endpoint allows agents to deploy new workflows at runtime
 */
app.post('/a2a/deploy', async (req: Request, res: Response): Promise<void> => {
    // Declare variables at function level so they're accessible in catch block
    let pkg: string = '', protocol: string = '', token: string = '', nplCode: string = '';
    let technicalToken: string = '';
    
    try {
        const { package: pkgParam, protocol: protocolParam, nplCode: nplCodeParam, token: tokenParam } = req.body;
        pkg = pkgParam;
        protocol = protocolParam;
        token = tokenParam;
        nplCode = nplCodeParam;

        if (!pkg || !protocol || !nplCode || !token) {
            res.status(400).json({
                error: 'Missing required parameters: package, protocol, nplCode, token'
            });
            return;
        }

        // Validate user token (for audit purposes)
        const claims = validateToken(token);
        
        // Get technical token for deployment using token manager
        technicalToken = await tokenManager.getAccessToken();

        console.log(`Deploying new protocol: ${pkg}.${protocol}`);

        // Create ZIP file with proper folder structure
        const JSZip = require('jszip');
        const zip = new JSZip();
        
        // Add the NPL file to the correct folder structure
        // NPL engine expects: src/main/npl-{version}/{package}/{protocol}.npl
        const nplPath = `src/main/npl-1.0.0/${pkg}/${protocol}.npl`;
        zip.file(nplPath, nplCode);
        
        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Create FormData for multipart upload
        const FormData = require('form-data');
        const axios = require('axios');
        const form = new FormData();
        form.append('archive', zipBuffer, {
            filename: `${pkg}-${protocol}.zip`,
            contentType: 'application/zip'
        });

        // Deploy to NPL engine via management API using technical user token
        // Protocol deployment (prototype creation) should use technical user
        const deployResponse = await axios.post(
            `${NPL_MANAGEMENT_URL}/management/application`,
            form,
            {
                headers: {
                    'Authorization': `Bearer ${technicalToken}`,
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const deployResult = deployResponse.data;
        console.log(`Protocol ${pkg}.${protocol} deployed successfully`);

        // Track this deployment and wait for event confirmation
        dynamicMethodManager.trackDeployment(pkg, protocol);
        console.log(`📋 Tracking deployment: ${pkg}.${protocol} - waiting for event confirmation`);

        // Regenerate A2A methods for the new protocol
        console.log('Regenerating A2A methods...');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            // Run the generator script to create new method handlers
            const { stdout, stderr } = await execAsync('node generate-a2a-methods.js', {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    NPL_ENGINE_URL: NPL_ENGINE_URL,
                    NPL_TOKEN: technicalToken
                }
            });

            if (stderr) {
                console.warn('Generator warnings:', stderr);
            }

            console.log('A2A methods regenerated successfully');

            // Force discovery and regeneration
            await dynamicMethodManager.forceDiscovery();

            // Reload agent skills to pick up the new protocol
            reloadAgentSkills();

            res.json({
                success: true,
                result: {
                    package: pkg,
                    protocol: protocol,
                    deployment: deployResult,
                    a2aMethodsRegenerated: true
                },
                message: `Protocol ${pkg}.${protocol} deployed and A2A methods updated`,
                timestamp: new Date().toISOString()
            });

        } catch (genError: any) {
            console.error('Failed to regenerate A2A methods:', genError);
            
            // Protocol was deployed but A2A methods couldn't be regenerated
            res.json({
                success: true,
                result: {
                    package: pkg,
                    protocol: protocol,
                    deployment: deployResult,
                    a2aMethodsRegenerated: false,
                    warning: 'Protocol deployed but A2A methods could not be regenerated'
                },
                message: `Protocol ${pkg}.${protocol} deployed successfully`,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error: any) {
        console.error('Protocol deployment error:', error);
        
        // Try to extract detailed error information from axios response
        let errorMessage = error.message;
        let errorDetails = {};
        
        if (error.response) {
            errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
            errorDetails = {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data
            };
            console.error('Detailed error response:', JSON.stringify(errorDetails, null, 2));
        }
        
        // Handle 409 Conflict as success (protocol already deployed)
        if (error.response && error.response.status === 409) {
            console.log(`Protocol ${pkg}.${protocol} already deployed, treating as success`);
            
            // Protocol already deployed, trigger method generation directly
            await dynamicMethodManager.regenerateMethodsForPackage(pkg);
            console.log('🔄 DynamicMethodManager: Methods regenerated for existing protocol');
            
            // Regenerate A2A methods for the existing protocol
            console.log('Regenerating A2A methods for existing protocol...');
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            try {
                // Run the generator script to create new method handlers
                const { stdout, stderr } = await execAsync('node generate-a2a-methods.js', {
                    cwd: process.cwd(),
                    env: {
                        ...process.env,
                        NPL_ENGINE_URL: NPL_ENGINE_URL,
                        NPL_TOKEN: technicalToken
                    }
                });

                if (stderr) {
                    console.warn('Generator warnings:', stderr);
                }

                console.log('A2A methods regenerated successfully for existing protocol');

                // Force discovery and regeneration
                await dynamicMethodManager.forceDiscovery();

                // Reload agent skills to pick up the existing protocol
                reloadAgentSkills();

                res.json({
                    success: true,
                    result: {
                        package: pkg,
                        protocol: protocol,
                        deployment: 'already_deployed',
                        a2aMethodsRegenerated: true
                    },
                    message: `Protocol ${pkg}.${protocol} already deployed, A2A methods updated`,
                    timestamp: new Date().toISOString()
                });
                return;
            } catch (genError: any) {
                console.error('Failed to regenerate A2A methods for existing protocol:', genError);
                
                // Protocol was already deployed but A2A methods couldn't be regenerated
                res.json({
                    success: true,
                    result: {
                        package: pkg,
                        protocol: protocol,
                        deployment: 'already_deployed',
                        a2aMethodsRegenerated: false,
                        warning: 'Protocol already deployed but A2A methods could not be regenerated'
                    },
                    message: `Protocol ${pkg}.${protocol} already deployed`,
                    timestamp: new Date().toISOString()
                });
                return;
            }
        }
        
        res.status(500).json({
            error: errorMessage,
            details: errorDetails,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Manual refresh endpoint for A2A method handlers
 * Useful for admin operations or when deployment doesn't trigger regeneration
 */
app.post('/a2a/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({
                error: 'Missing required parameter: token'
            });
            return;
        }

        // Validate token
        const claims = validateToken(token);

        console.log('Manual A2A method refresh requested');

        // Force discovery and regeneration using the new automatic system
        await dynamicMethodManager.forceDiscovery();

        // Reload agent skills to pick up any new protocols
        reloadAgentSkills();

        res.json({
            success: true,
            result: {
                a2aMethodsRegenerated: true,
                availableOperations: dynamicMethodManager.getAvailableOperations()
            },
            message: 'A2A methods refreshed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Manual refresh error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Force discovery endpoint for immediate protocol discovery
 * Triggers immediate discovery and regeneration of methods
 */
app.post('/a2a/discover', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({
                error: 'Missing required parameter: token'
            });
            return;
        }

        // Validate token
        const claims = validateToken(token);

        console.log('Manual protocol discovery requested');

        // Force discovery and regeneration
        await dynamicMethodManager.forceDiscovery();

        // Reload agent skills to pick up any new protocols
        reloadAgentSkills();

        res.json({
            success: true,
            result: {
                discoveryTriggered: true,
                availableOperations: dynamicMethodManager.getAvailableOperations(),
                availableMappings: dynamicMethodManager.getAllMappings().length
            },
            message: 'Protocol discovery completed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Protocol discovery error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * List deployed protocols
 * Shows all protocols currently deployed in the NPL engine
 */
app.get('/a2a/protocols', async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || '';

        if (!token) {
            res.status(400).json({
                error: 'Missing Authorization header with Bearer token'
            });
            return;
        }

        // Validate token
        const claims = validateToken(token);

        console.log('Discovering deployed packages...');
        
        // Use the same approach as generate-a2a-methods.js
        let packages: string[] = [];
        
        try {
            // First try to get the engine OpenAPI spec
            const engineResponse = await fetch(
                `${NPL_ENGINE_URL}/openapi/engine.yml`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json, application/yaml, text/yaml'
                    }
                }
            );

            if (engineResponse.ok) {
                const yamlText = await engineResponse.text();
                
                // Try to parse as YAML first, then as JSON
                let engineSpec: any;
                try {
                    // Try to parse as YAML
                    const yaml = require('js-yaml');
                    engineSpec = yaml.load(yamlText);
                } catch (yamlError: any) {
                    try {
                        // If YAML fails, try JSON
                        engineSpec = JSON.parse(yamlText);
                    } catch (jsonError: any) {
                        throw new Error(`Failed to parse engine specs (YAML: ${yamlError.message}, JSON: ${jsonError.message})`);
                    }
                }
                
                // Extract package names from the OpenAPI spec paths
                const discoveredPackages = new Set<string>();
                
                for (const [path, methods] of Object.entries(engineSpec.paths || {})) {
                    // Match patterns like /npl/{package}/-/openapi.json
                    const nplMatch = path.match(/\/npl\/([^\/]+)\/-\/openapi\.json/);
                    if (nplMatch) {
                        discoveredPackages.add(nplMatch[1]);
                    }
                }
                
                packages = Array.from(discoveredPackages);
                console.log(`Discovered ${packages.length} packages from engine spec:`, packages);
            }
        } catch (error) {
            console.warn('Failed to discover packages from engine spec:', error);
        }

        // If no packages found, use deployed packages file
        if (packages.length === 0) {
            console.log('No packages found in engine spec - will use deployed packages file');
        }

        // Get protocol details for each package
        const protocolDetails = [];
        for (const pkg of packages) {
            try {
                const response = await fetch(
                    `${NPL_ENGINE_URL}/npl/${pkg}/-/openapi.json`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const spec = await response.json() as any;
                    
                    // Extract protocol names from paths
                    const protocols = new Set<string>();
                    for (const [path, methods] of Object.entries(spec.paths || {})) {
                        // Match patterns like /npl/package/ProtocolName/{id}/method
                        const protocolMatch = path.match(/\/npl\/[^\/]+\/([^\/]+)\/\{id\}/);
                        if (protocolMatch) {
                            protocols.add(protocolMatch[1]);
                        }
                    }
                    
                    for (const protocol of protocols) {
                        protocolDetails.push({
                            package: pkg,
                            protocol: protocol,
                            openapiUrl: `${NPL_ENGINE_URL}/npl/${pkg}/-/openapi.json`
                        });
                    }
                }
            } catch (error) {
                console.warn(`Failed to get details for package ${pkg}:`, error);
            }
        }

        res.json({
            success: true,
            result: {
                packages: packages,
                protocols: protocolDetails,
                count: protocolDetails.length,
                a2aOperations: dynamicMethodManager.getAvailableOperations()
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('List protocols error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Instantiate a protocol with multi-party consent
 * All parties provide their JWTs simultaneously for atomic protocol creation
 */
app.post('/a2a/instantiate', async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            package: pkg, 
            protocol, 
            parties, 
            initialData, 
            orchestratorToken 
        } = req.body;

        if (!pkg || !protocol || !parties || !initialData || !orchestratorToken) {
            res.status(400).json({
                error: 'Missing required parameters: package, protocol, parties, initialData, orchestratorToken'
            });
            return;
        }

        console.log(`Instantiating protocol: ${pkg}.${protocol} with ${Object.keys(parties).length} parties`);

        // Validate orchestrator token (the service making the request)
        const orchestratorClaims = validateToken(orchestratorToken);

        // Validate all party JWTs and extract claims
        const validatedParties: { [key: string]: any } = {};
        const partyEntities: { [key: string]: any } = {};

        for (const [partyName, partyData] of Object.entries(parties)) {
            const partyDataTyped = partyData as { jwt: string };
            if (!partyDataTyped.jwt) {
                res.status(400).json({
                    error: `Missing JWT for party: ${partyName}`
                });
                return;
            }

            try {
                // Validate each party's JWT
                const partyClaims = validateToken(partyDataTyped.jwt);
                
                // Store validated claims
                validatedParties[partyName] = {
                    claims: partyClaims,
                    token: partyDataTyped.jwt
                };

                // Create party entity for NPL engine
                partyEntities[partyName] = {
                    "entity": {
                        "preferred_username": [partyClaims.preferred_username]
                    },
                    "access": {}
                };

                console.log(`✅ Validated party: ${partyName} (${partyClaims.preferred_username})`);

            } catch (error: any) {
                console.error(`❌ Failed to validate JWT for party ${partyName}:`, error.message);
                res.status(401).json({
                    error: `Invalid JWT for party ${partyName}: ${error.message}`
                });
                return;
            }
        }

        // Prepare protocol instantiation data
        const protocolData = {
            ...initialData,
            "@parties": partyEntities
        };

        // Debug: Log the exact payload being sent to NPL engine
        console.log('🔍 DEBUG: Protocol instantiation payload:');
        console.log(JSON.stringify(protocolData, null, 2));

        // Use the first party's token to instantiate the protocol
        // (all tokens are validated, so any will work for the API call)
        const firstPartyToken = Object.values(validatedParties)[0].token;

        console.log(`📋 Instantiating protocol with parties:`, Object.keys(partyEntities));

        // Call NPL engine to instantiate the protocol
        const nplResponse = await fetch(
            `${NPL_ENGINE_URL}/npl/${pkg}/${protocol}/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${firstPartyToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(protocolData)
            }
        );

        if (!nplResponse.ok) {
            const errorText = await nplResponse.text();
            throw new Error(`NPL engine error: ${nplResponse.status} ${nplResponse.statusText} - ${errorText}`);
        }

        const protocolInstance = await nplResponse.json() as { '@id': string; '@state': string };

        console.log(`✅ Protocol instantiated successfully: ${protocolInstance['@id']}`);

        // After successful instantiation, force discovery and regeneration
        await dynamicMethodManager.forceDiscovery();
        console.log('🔄 DynamicMethodManager: Refreshed after protocol instantiation');

        // Return the protocol instance with party binding information
        res.json({
            success: true,
            result: {
                protocolId: protocolInstance['@id'],
                package: pkg,
                protocol: protocol,
                state: protocolInstance['@state'],
                parties: Object.keys(partyEntities),
                partyBindings: Object.fromEntries(
                    Object.entries(validatedParties).map(([name, data]) => [
                        name, 
                        {
                            identifier: data.claims.sub || data.claims.preferred_username,
                            name: data.claims.name || data.claims.preferred_username,
                            validated: true
                        }
                    ])
                ),
                instantiatedAt: new Date().toISOString(),
                orchestrator: orchestratorClaims.preferred_username
            },
            message: `Protocol ${pkg}.${protocol} instantiated with ${Object.keys(parties).length} parties`,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Protocol instantiation error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start periodic cleanup of old messages (every hour)
setInterval(async () => {
  try {
    const deletedCount = await agentCommunication.cleanupOldMessages();
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old messages`);
    }
  } catch (error) {
    console.error('❌ Message cleanup error:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Start server
app.listen(PORT, () => {
  console.log("A2A Server (NPL Integration) running on port " + PORT);
  console.log("NPL Integration: Enabled");
  console.log("Protocol Deployment: Enabled");
  console.log("Protocol Instantiation: Enabled");
  console.log("Agent Communication: Enabled");
  console.log("Available protocols: " + getAllProtocols().map((p: any) => `${p.package}.${p.protocol}`).join(", "));
});

export default app; 