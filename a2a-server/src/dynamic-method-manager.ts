import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

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

class DynamicMethodManager {
    private methodMappings: MethodMapping[] = [];
    private methodHandlers: MethodHandlers = {};
    private lastRefresh = 0;
    private refreshInterval = 30000; // 30 seconds - longer interval for auto-discovery
    private lastDiscovery = 0;
    private discoveryInterval = 60000; // 1 minute - check for new protocols
    private knownPackages = new Set<string>();
    private NPL_ENGINE_URL: string;
    private NPL_TOKEN: string;

    constructor() {
        this.NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
        this.NPL_TOKEN = process.env.NPL_TOKEN || '';
        this.loadMethods();
        this.startAutoDiscovery();
    }

    /**
     * Start automatic discovery of new protocols
     */
    private startAutoDiscovery() {
        // Initial discovery
        this.discoverAndGenerateMethods();
        
        // Set up periodic discovery
        setInterval(() => {
            this.discoverAndGenerateMethods();
        }, this.discoveryInterval);
    }

    /**
     * Discover packages and generate methods automatically
     */
    private async discoverAndGenerateMethods() {
        try {
            console.log('DynamicMethodManager: Starting automatic protocol discovery...');
            
            // Discover available packages
            const packages = await this.discoverPackages();
            console.log(`DynamicMethodManager: Discovered ${packages.length} packages:`, packages);
            
            // Check if we have new packages
            const newPackages = packages.filter(pkg => !this.knownPackages.has(pkg));
            if (newPackages.length > 0) {
                console.log(`DynamicMethodManager: Found ${newPackages.length} new packages:`, newPackages);
                await this.generateMethodsForPackages(packages);
                this.knownPackages = new Set(packages);
            }
            
            this.lastDiscovery = Date.now();
        } catch (error) {
            console.error('DynamicMethodManager: Auto-discovery failed:', error);
        }
    }

    /**
     * Discover all available packages in the NPL engine
     */
    private async discoverPackages(): Promise<string[]> {
        const knownPackages = ['rfp_workflow', 'test_deploy'];
        const availablePackages: string[] = [];
        
        for (const pkg of knownPackages) {
            try {
                const response = await fetch(`${this.NPL_ENGINE_URL}/npl/${pkg}/-/openapi.json`, {
                    headers: {
                        'Authorization': `Bearer ${this.NPL_TOKEN}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    availablePackages.push(pkg);
                    console.log(`DynamicMethodManager: Package ${pkg} is available`);
                }
            } catch (error) {
                console.log(`DynamicMethodManager: Package ${pkg} is not available:`, error);
            }
        }
        
        return availablePackages;
    }

    /**
     * Generate methods for discovered packages
     */
    private async generateMethodsForPackages(packages: string[]) {
        try {
            // Import the generation functions dynamically
            const { generateMethodHandlers, generateMethodMappings, generateAgentSkills } = await import('./method-generator');
            
            const allMappings: MethodMapping[] = [];
            const allHandlers: MethodHandlers = {};
            const allSkills: ProtocolInfo[] = [];
            
            for (const pkg of packages) {
                try {
                    console.log(`DynamicMethodManager: Generating methods for package ${pkg}...`);
                    
                    // Fetch OpenAPI spec for the package
                    const response = await fetch(`${this.NPL_ENGINE_URL}/npl/${pkg}/-/openapi.json`, {
                        headers: {
                            'Authorization': `Bearer ${this.NPL_TOKEN}`,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        console.warn(`DynamicMethodManager: Failed to fetch OpenAPI spec for ${pkg}`);
                        continue;
                    }
                    
                    const openAPISpec = await response.json();
                    
                    // Generate methods for this package
                    const packageMappings = generateMethodMappings(openAPISpec, pkg);
                    const packageHandlers = generateMethodHandlers(openAPISpec, pkg);
                    const packageSkills = generateAgentSkills(openAPISpec, pkg);
                    
                    allMappings.push(...packageMappings);
                    Object.assign(allHandlers, packageHandlers);
                    allSkills.push(...packageSkills);
                    
                } catch (error) {
                    console.error(`DynamicMethodManager: Failed to generate methods for ${pkg}:`, error);
                }
            }
            
            // Update the manager's state
            this.methodMappings = allMappings;
            this.methodHandlers = allHandlers;
            
            // Save to files for persistence
            this.saveGeneratedFiles(allMappings, allHandlers, allSkills);
            
            console.log(`DynamicMethodManager: Generated ${allMappings.length} mappings and ${Object.keys(allHandlers).length} handlers`);
            
        } catch (error) {
            console.error('DynamicMethodManager: Failed to generate methods:', error);
        }
    }

    /**
     * Save generated files for persistence
     */
    private saveGeneratedFiles(mappings: MethodMapping[], handlers: MethodHandlers, skills: ProtocolInfo[]) {
        try {
            const basePath = __dirname;
            
            // Save method mappings
            const mappingsContent = `module.exports = { 
                METHOD_MAPPINGS: ${JSON.stringify(mappings, null, 2)},
                findMethodMapping: function(package, protocol, method) {
                    return this.METHOD_MAPPINGS.find(m => 
                        m.package === package && m.protocol === protocol && m.method === method.toLowerCase()
                    );
                }
            };`;
            writeFileSync(join(basePath, 'method-mappings.js'), mappingsContent);
            
            // Save method handlers
            const handlersContent = Object.entries(handlers)
                .map(([name, handler]) => `module.exports.${name} = ${handler.toString()};`)
                .join('\n\n');
            writeFileSync(join(basePath, 'method-handlers.js'), handlersContent);
            
            // Save agent skills
            const skillsContent = `module.exports = {
                AGENT_SKILLS: ${JSON.stringify(skills, null, 2)},
                getProtocolSkills: function(package, protocol) {
                    return module.exports.AGENT_SKILLS.find(s => s.package === package && s.protocol === protocol);
                },
                getAllProtocols: function() {
                    return module.exports.AGENT_SKILLS.map(s => ({ package: s.package, protocol: s.protocol }));
                }
            };`;
            writeFileSync(join(basePath, 'agent-skills.js'), skillsContent);
            
        } catch (error) {
            console.error('DynamicMethodManager: Failed to save generated files:', error);
        }
    }

    /**
     * Load method mappings and handlers dynamically
     */
    private loadMethods() {
        try {
            const basePath = __dirname;
            
            const methodMappingsPath = join(basePath, 'method-mappings');
            const methodHandlersPath = join(basePath, 'method-handlers');

            // Clear require cache to force reload
            delete require.cache[require.resolve(methodMappingsPath)];
            delete require.cache[require.resolve(methodHandlersPath)];

            // Load fresh modules
            const { findMethodMapping, METHOD_MAPPINGS } = require(methodMappingsPath);
            const methodHandlersModule = require(methodHandlersPath);

            // Extract all exported functions as handlers
            this.methodHandlers = {};
            for (const [key, value] of Object.entries(methodHandlersModule)) {
                if (typeof value === 'function') {
                    this.methodHandlers[key] = value as (params: any) => Promise<any>;
                }
            }

            // Load mappings
            this.methodMappings = METHOD_MAPPINGS || [];

            this.lastRefresh = Date.now();
            console.log(`DynamicMethodManager: Loaded ${Object.keys(this.methodHandlers).length} handlers and ${this.methodMappings.length} mappings`);
        } catch (error) {
            console.error('DynamicMethodManager: Failed to load methods:', error);
        }
    }

    /**
     * Check if refresh is needed and reload if necessary
     */
    private checkAndRefresh() {
        const now = Date.now();
        if (now - this.lastRefresh > this.refreshInterval) {
            this.loadMethods();
        }
    }

    /**
     * Force immediate refresh
     */
    public forceRefresh() {
        console.log('DynamicMethodManager: Forcing refresh...');
        this.loadMethods();
    }

    /**
     * Force immediate discovery and regeneration
     */
    public async forceDiscovery() {
        console.log('DynamicMethodManager: Forcing discovery and regeneration...');
        await this.discoverAndGenerateMethods();
    }

    /**
     * Find method mapping
     */
    public findMethodMapping(pkg: string, protocol: string, method: string): MethodMapping | undefined {
        this.checkAndRefresh();
        console.log(`DEBUG: findMethodMapping called with pkg=${pkg}, protocol=${protocol}, method=${method}`);
        console.log(`DEBUG: Available mappings count: ${this.methodMappings.length}`);
        // Print all mappings for inspection
        for (const m of this.methodMappings) {
            console.log(`DEBUG: mapping: package=${m.package}, protocol=${m.protocol}, method=${m.method}`);
        }
        console.log(`DEBUG: Available mappings for ${pkg}.${protocol}:`, this.methodMappings.filter(m => m.package === pkg && m.protocol === protocol));
        
        const result = this.methodMappings.find(m => 
            m.package === pkg && 
            m.protocol === protocol && 
            m.method === method.toLowerCase()
        );
        
        console.log(`DEBUG: findMethodMapping result:`, result);
        return result;
    }

    /**
     * Execute method by operation ID
     */
    public async executeMethod(operationId: string, params: any): Promise<any> {
        this.checkAndRefresh();
        
        const handler = this.methodHandlers[operationId];
        if (!handler) {
            throw new Error(`Unknown method: ${operationId}`);
        }

        return await handler(params);
    }

    /**
     * Get all available method mappings
     */
    public getAllMappings(): MethodMapping[] {
        this.checkAndRefresh();
        return [...this.methodMappings];
    }

    /**
     * Get all available operation IDs
     */
    public getAvailableOperations(): string[] {
        this.checkAndRefresh();
        return Object.keys(this.methodHandlers);
    }

    /**
     * Check if method exists
     */
    public hasMethod(operationId: string): boolean {
        this.checkAndRefresh();
        return operationId in this.methodHandlers;
    }
}

export const dynamicMethodManager = new DynamicMethodManager(); 