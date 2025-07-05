import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'fs';
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
    private deployedPackagesFile = '/tmp/deployed-packages.json';
    private NPL_ENGINE_URL: string;
    private NPL_TOKEN: string;
    private TECHNICAL_USER_TOKEN: string;

    constructor() {
        this.NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
        this.NPL_TOKEN = process.env.NPL_TOKEN || '';
        this.TECHNICAL_USER_TOKEN = process.env.NPL_TECHNICAL_USER_TOKEN || '';
        this.loadMethods();
        this.loadDeployedPackagesAndRegenerate();
        this.startAutoDiscovery();
    }

    /**
     * Start automatic discovery of new protocols
     */
    private startAutoDiscovery() {
        // Initial discovery - only use deployed packages file, don't query engine
        this.loadDeployedPackagesAndRegenerate();
        
        // Set up periodic discovery - only check deployed packages file
        setInterval(() => {
            this.loadDeployedPackagesAndRegenerate();
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
     * Discover all available packages in the NPL engine using technical user token
     */
    private async discoverPackages(): Promise<string[]> {
        const availablePackages: string[] = [];
        
        // Use technical user token for discovery if available
        const discoveryToken = this.TECHNICAL_USER_TOKEN || this.NPL_TOKEN;
        
        if (!discoveryToken) {
            console.warn('DynamicMethodManager: No token available for discovery, using deployed packages file');
            // Load from deployed packages file if no token available
            return this.loadDeployedPackages();
        }
        
        try {
            // First try to get the engine OpenAPI spec to discover all packages
            console.log('DynamicMethodManager: Attempting dynamic package discovery via engine spec...');
            const engineResponse = await fetch(
                `${this.NPL_ENGINE_URL}/openapi/engine.yml`,
                {
                    headers: {
                        'Authorization': `Bearer ${discoveryToken}`,
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
                
                const packages = Array.from(discoveredPackages);
                console.log(`DynamicMethodManager: Discovered ${packages.length} packages from engine spec:`, packages);
                
                // If no packages discovered from engine spec, use deployed packages file
                if (packages.length === 0) {
                    console.log('DynamicMethodManager: No packages discovered from engine spec, using deployed packages file');
                    return this.loadDeployedPackages();
                }
                
                console.log('DynamicMethodManager: Proceeding with package verification...');
                
                // Verify each package is actually accessible
                for (const pkg of packages) {
                    try {
                        const response = await fetch(`${this.NPL_ENGINE_URL}/npl/${pkg}/-/openapi.json`, {
                            headers: {
                                'Authorization': `Bearer ${discoveryToken}`,
                                'Accept': 'application/json'
                            }
                        });
                        if (response.ok) {
                            availablePackages.push(pkg);
                            console.log(`DynamicMethodManager: Package ${pkg} verified and available`);
                        }
                    } catch (error) {
                        console.log(`DynamicMethodManager: Package ${pkg} verification failed:`, error);
                    }
                }
                
                // If no packages are accessible after verification, use deployed packages file
                if (availablePackages.length === 0) {
                    console.log('DynamicMethodManager: No packages accessible after verification, using deployed packages file');
                    return this.loadDeployedPackages();
                }
                
                return availablePackages;
            } else {
                // Engine spec endpoint not available, use deployed packages file
                console.log(`DynamicMethodManager: Engine spec endpoint not available (${engineResponse.status}), using deployed packages file`);
                return this.loadDeployedPackages();
            }
        } catch (error) {
            console.warn('DynamicMethodManager: Dynamic discovery failed, using deployed packages file:', error instanceof Error ? error.message : String(error));
            return this.loadDeployedPackages();
        }
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
                            'Authorization': `Bearer ${this.TECHNICAL_USER_TOKEN || this.NPL_TOKEN}`,
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
            
            console.log(`DynamicMethodManager: Generated ${allMappings.length} mappings and ${Object.keys(allHandlers).length} handlers`);
            console.log(`DynamicMethodManager: Generated ${allSkills.length} protocol skills`);
            
            // Save to files for persistence
            this.saveGeneratedFiles(allMappings, allHandlers, allSkills);
            
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
            
            console.log(`DynamicMethodManager: Saving generated files...`);
            console.log(`DynamicMethodManager: - Mappings: ${mappings.length}`);
            console.log(`DynamicMethodManager: - Handlers: ${Object.keys(handlers).length}`);
            console.log(`DynamicMethodManager: - Skills: ${skills.length} protocols`);
            
            // Log the skills being saved
            for (const skill of skills) {
                console.log(`DynamicMethodManager: - Skill: ${skill.package}.${skill.protocol} (${skill.methods.length} methods)`);
            }
            
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
            const skillsContent = `/**
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

module.exports = { AGENT_SKILLS, getProtocolSkills, getAllProtocols };`;
            writeFileSync(join(basePath, 'agent-skills.js'), skillsContent);
            
            console.log(`DynamicMethodManager: Files saved successfully to ${basePath}`);
            
            // Trigger a reload of agent skills in the server
            this.triggerAgentSkillsReload();
            
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
            
            const methodMappingsPath = join(basePath, 'method-mappings.js');
            const methodHandlersPath = join(basePath, 'method-handlers.js');

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
        await this.loadDeployedPackagesAndRegenerate();
    }

    /**
     * Load deployed packages from file and regenerate methods
     */
    private async loadDeployedPackagesAndRegenerate() {
        try {
            console.log('DynamicMethodManager: Loading deployed packages and regenerating methods...');
            const packages = this.loadDeployedPackages();
            if (packages.length > 0) {
                console.log(`DynamicMethodManager: Found ${packages.length} deployed packages:`, packages);
                await this.generateMethodsForPackages(packages);
                this.knownPackages = new Set(packages);
            } else {
                console.log('DynamicMethodManager: No deployed packages found, will rely on discovery');
            }
        } catch (error) {
            console.error('DynamicMethodManager: Failed to load deployed packages:', error);
        }
    }

    /**
     * Load deployed packages from file
     */
    private loadDeployedPackages(): string[] {
        try {
            const fs = require('fs');
            // Use the absolute path directly since this.deployedPackagesFile is already absolute
            const filePath = this.deployedPackagesFile;
            
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const packages = JSON.parse(data);
                console.log(`DynamicMethodManager: Loaded ${packages.length} packages from ${this.deployedPackagesFile}`);
                return packages;
            } else {
                console.log(`DynamicMethodManager: No deployed packages file found at ${filePath}`);
                return [];
            }
        } catch (error) {
            console.error('DynamicMethodManager: Failed to load deployed packages file:', error);
            return [];
        }
    }

    /**
     * Save deployed packages to file
     */
    private saveDeployedPackages(packages: string[]) {
        try {
            const fs = require('fs');
            // Use the absolute path directly since this.deployedPackagesFile is already absolute
            const filePath = this.deployedPackagesFile;
            
            fs.writeFileSync(filePath, JSON.stringify(packages, null, 2));
            console.log(`DynamicMethodManager: Saved ${packages.length} packages to ${this.deployedPackagesFile}`);
        } catch (error) {
            console.error('DynamicMethodManager: Failed to save deployed packages file:', error);
        }
    }

    /**
     * Add a package to the deployed packages list
     */
    public addDeployedPackage(packageName: string) {
        const packages = this.loadDeployedPackages();
        if (!packages.includes(packageName)) {
            packages.push(packageName);
            this.saveDeployedPackages(packages);
            console.log(`DynamicMethodManager: Added package ${packageName} to deployed packages list`);
        }
    }

    /**
     * Remove a package from the deployed packages list
     */
    public removeDeployedPackage(packageName: string) {
        const packages = this.loadDeployedPackages();
        const filteredPackages = packages.filter(pkg => pkg !== packageName);
        if (filteredPackages.length !== packages.length) {
            this.saveDeployedPackages(filteredPackages);
            console.log(`DynamicMethodManager: Removed package ${packageName} from deployed packages list`);
        }
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

    /**
     * Trigger a reload of agent skills in the server
     */
    private triggerAgentSkillsReload() {
        try {
            // Clear the require cache for the agent-skills module
            delete require.cache[require.resolve('./agent-skills')];
            console.log('DynamicMethodManager: Agent skills cache cleared, server will reload on next request');
        } catch (error) {
            console.error('DynamicMethodManager: Failed to clear agent skills cache:', error);
        }
    }
}

export const dynamicMethodManager = new DynamicMethodManager(); 