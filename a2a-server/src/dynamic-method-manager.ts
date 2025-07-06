import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { MethodMapping, MethodHandlers, ProtocolInfo } from './types';

interface ApiPrototype {
    name: string;
    prototypeType: string;
    parties?: ApiNamedArgument[];
    arguments?: ApiNamedArgument[];
    actions?: ApiAction[];
}

interface ApiAction {
    name: string;
    parties: ApiNamedArgument[];
    arguments: ApiNamedArgument[];
    returnType: string;
}

interface ApiNamedArgument {
        name: string;
    type: string;
}

interface ApiPrototypePackageData {
    payloadType: string;
    prototype?: ApiPrototype;
    id?: number;
}

class DynamicMethodManager {
    private methodMappings: MethodMapping[] = [];
    private methodHandlers: MethodHandlers = {};
    private lastRefresh = 0;
    private refreshInterval = 30000; // 30 seconds - for fallback refresh
    private knownPackages = new Set<string>();
    private NPL_ENGINE_URL: string;
    private NPL_TOKEN: string;
    private TECHNICAL_USER_TOKEN: string;
    private isEventStreamConnected = false;
    private tokenRefreshInterval: NodeJS.Timeout | null = null;
    private currentToken: string = '';
    private tokenExpiryTime: number = 0;
    private refreshTokenPromise: Promise<void> | null = null;
    private isRefreshingToken: boolean = false;
    private backupStreamActive: boolean = false;
    private lastEventTimestamp: number = 0;
    private pendingDeployments: Map<string, { timestamp: number; retryCount: number }> = new Map();
    private deploymentTimeout: number = 30000; // 30 seconds to wait for event

    constructor() {
        this.NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://127.0.0.1:12000';
        this.NPL_TOKEN = process.env.NPL_TOKEN || '';
        this.TECHNICAL_USER_TOKEN = process.env.NPL_TECHNICAL_USER_TOKEN || '';
        
        this.loadMethods();
        this.initializeTokenRefresh();
        this.subscribeToPrototypeStream();
        this.startFallbackRefresh();
    }

    /**
     * Initialize token refresh mechanism
     */
    private initializeTokenRefresh() {
        // Get initial token
        this.refreshToken();
        
        // Set up periodic token refresh (every 8 minutes to be safe)
        this.tokenRefreshInterval = setInterval(() => {
            this.refreshToken();
        }, 8 * 60 * 1000); // 8 minutes (tokens typically last 15 minutes)
    }

    /**
     * Refresh the authentication token (thread-safe)
     */
    private async refreshToken(): Promise<void> {
        // Prevent multiple simultaneous token refreshes
        if (this.isRefreshingToken && this.refreshTokenPromise) {
            console.log('DynamicMethodManager: Token refresh already in progress, waiting...');
            return this.refreshTokenPromise;
        }

        this.isRefreshingToken = true;
        this.refreshTokenPromise = this.performTokenRefresh();
        
        try {
            await this.refreshTokenPromise;
        } finally {
            this.isRefreshingToken = false;
            this.refreshTokenPromise = null;
        }
    }

    /**
     * Perform the actual token refresh
     */
    private async performTokenRefresh(): Promise<void> {
        try {
            console.log('DynamicMethodManager: Starting token refresh...');
            
            // Try to get a new technical token from the management API
            const response = await fetch(`${this.NPL_ENGINE_URL.replace('12000', '12400')}/management/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'technical',
                    password: 'technical'
                })
            });

            if (response.ok) {
                const tokenData = await response.json() as { access_token: string; expires_in?: number };
                this.currentToken = tokenData.access_token;
                
                // Calculate expiry time (default to 15 minutes if not provided)
                const expiresIn = tokenData.expires_in || 900; // 15 minutes
                this.tokenExpiryTime = Date.now() + (expiresIn * 1000);
                
                console.log(`DynamicMethodManager: Token refreshed successfully, expires in ${expiresIn} seconds`);
                
                // If we're connected to event stream, reconnect with new token
                if (this.isEventStreamConnected) {
                    console.log('DynamicMethodManager: Reconnecting event stream with new token...');
                    this.isEventStreamConnected = false;
                    setTimeout(() => {
                        this.subscribeToPrototypeStream();
                    }, 1000);
                }
            } else {
                console.warn('DynamicMethodManager: Failed to refresh token from management API, using fallback');
                this.currentToken = this.TECHNICAL_USER_TOKEN || this.NPL_TOKEN;
                this.tokenExpiryTime = Date.now() + (15 * 60 * 1000); // Assume 15 minutes
            }
        } catch (error) {
            console.warn('DynamicMethodManager: Token refresh failed, using fallback:', error);
            this.currentToken = this.TECHNICAL_USER_TOKEN || this.NPL_TOKEN;
            this.tokenExpiryTime = Date.now() + (15 * 60 * 1000); // Assume 15 minutes
        }
    }

    /**
     * Get current valid token
     */
    private getValidToken(): string {
        // Check if token is expired or will expire soon (within 2 minutes)
        if (Date.now() > (this.tokenExpiryTime - 2 * 60 * 1000)) {
            console.log('DynamicMethodManager: Token expired or expiring soon, refreshing...');
            this.refreshToken();
        }
        
        return this.currentToken || this.TECHNICAL_USER_TOKEN || this.NPL_TOKEN;
    }

    /**
     * Subscribe to prototype events from Engine Streams API
     */
    private async subscribeToPrototypeStream() {
        try {
            console.log('DynamicMethodManager: Subscribing to prototype events...');
            
            // Get a valid token (with refresh if needed)
            const token = this.getValidToken();
            if (!token) {
                console.warn('DynamicMethodManager: No token available for prototype stream, using fallback refresh');
                this.startFallbackRefresh();
                return;
            }

            // Use fetch with streaming for authenticated SSE
            const response = await fetch(`${this.NPL_ENGINE_URL}/api/streams/prototypes`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('DynamicMethodManager: Token expired, refreshing and reconnecting...');
                    await this.refreshToken();
                    // Retry with new token after a short delay
                    setTimeout(() => {
                        this.subscribeToPrototypeStream();
                    }, 2000);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body for streaming');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            console.log('DynamicMethodManager: Prototype stream subscription established');
            this.isEventStreamConnected = true;

            // Process the stream
            this.processEventStream(reader, decoder);
            
        } catch (error) {
            console.warn('DynamicMethodManager: Failed to subscribe to prototype stream, using fallback refresh:', error);
            this.isEventStreamConnected = false;
            this.startFallbackRefresh();
        }
    }

    /**
     * Process the event stream
     */
    private async processEventStream(reader: ReadableStreamDefaultReader<Uint8Array>, decoder: any) {
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('DynamicMethodManager: Event stream ended');
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove 'data: ' prefix
                        if (data.trim()) {
                            this.handlePrototypeEvent({ data } as MessageEvent);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('DynamicMethodManager: Error processing event stream:', error);
            
            // Check if it's an authentication error
            if (error instanceof Error && error.message.includes('401')) {
                console.log('DynamicMethodManager: Authentication error in event stream, refreshing token...');
                await this.refreshToken();
            }
        } finally {
            this.isEventStreamConnected = false;
            // Attempt to reconnect after a delay
            setTimeout(() => {
                console.log('DynamicMethodManager: Attempting to reconnect to prototype stream...');
                this.subscribeToPrototypeStream();
            }, 5000);
        }
    }

    /**
     * Handle prototype events from the stream
     */
    private handlePrototypeEvent(event: MessageEvent) {
        try {
            const data: ApiPrototypePackageData = JSON.parse(event.data);
            
            // Update last event timestamp
            this.lastEventTimestamp = Date.now();
            
            // Handle heartbeat events
            if (data.payloadType === 'tick') {
                return; // Ignore heartbeat events
            }
            
            // Handle prototype events
            if (data.payloadType === 'prototype' && data.prototype?.prototypeType === 'protocol') {
                const protocolPrototype = data.prototype as ApiPrototype;
                const packageName = this.extractPackageNameFromEvent(data);
                
                if (packageName && protocolPrototype.name) {
                    console.log(`DynamicMethodManager: Protocol deployed: ${packageName}.${protocolPrototype.name}`);
                    console.log(`DynamicMethodManager: Available methods: ${protocolPrototype.actions?.map(a => a.name).join(', ') || 'none'}`);
                    
                    // Check if this was a tracked deployment
                    const wasTracked = this.confirmDeployment(packageName, protocolPrototype.name);
                    
                    // Add package to known packages if not already present
                    if (!this.knownPackages.has(packageName)) {
                        this.knownPackages.add(packageName);
                        console.log(`DynamicMethodManager: New package discovered: ${packageName}`);
                    }
                    
                    // Regenerate methods for this package
                    this.regenerateMethodsForPackage(packageName);
                }
            }
            
        } catch (error) {
            console.error('DynamicMethodManager: Error handling prototype event:', error);
        }
    }

    /**
     * Extract package name from prototype event
     * This is a simplified extraction - in practice, the package name might be in the event metadata
     */
    private extractPackageNameFromEvent(data: ApiPrototypePackageData): string | null {
        // For now, we'll need to discover packages through other means
        // This is a limitation of the current event structure
        // We might need to use the current-prototypes endpoint to get full package info
        return null;
    }

    /**
     * Start fallback refresh mechanism
     */
    private startFallbackRefresh() {
        // Initial discovery
        this.discoverAndRegenerateMethods();
        
        // Set up periodic refresh as fallback
        setInterval(() => {
            if (!this.isEventStreamConnected) {
                console.log('DynamicMethodManager: Event stream not connected, using fallback discovery...');
                this.discoverAndRegenerateMethods();
            }
        }, this.refreshInterval);
        
        // Set up backup polling during token refresh
        setInterval(() => {
            if (this.isRefreshingToken && !this.backupStreamActive) {
                console.log('DynamicMethodManager: Token refresh in progress, activating backup polling...');
                this.activateBackupPolling();
            }
        }, 5000); // Check every 5 seconds
    }

    /**
     * Activate backup polling during token refresh to catch missed events
     */
    private async activateBackupPolling() {
        if (this.backupStreamActive) return;
        
        this.backupStreamActive = true;
        console.log('DynamicMethodManager: Backup polling activated');
        
        try {
            // Poll for new prototypes every 2 seconds during token refresh
            const backupInterval = setInterval(async () => {
                if (!this.isRefreshingToken) {
                    console.log('DynamicMethodManager: Token refresh complete, stopping backup polling');
                    clearInterval(backupInterval);
                    this.backupStreamActive = false;
                    return;
                }
                
                // Quick check for new prototypes
                await this.quickPrototypeCheck();
            }, 2000);
            
            // Stop backup polling after 30 seconds max
            setTimeout(() => {
                clearInterval(backupInterval);
                this.backupStreamActive = false;
                console.log('DynamicMethodManager: Backup polling timeout');
            }, 30000);
            
        } catch (error) {
            console.error('DynamicMethodManager: Backup polling error:', error);
            this.backupStreamActive = false;
        }
    }

    /**
     * Quick check for new prototypes during token refresh
     */
    private async quickPrototypeCheck() {
        try {
            const token = this.getValidToken();
            if (!token) return;
            
            // Check current prototypes endpoint
            const response = await fetch(`${this.NPL_ENGINE_URL}/api/prototypes`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const prototypes = await response.json() as any[];
                const latestTimestamp = Math.max(...prototypes.map(p => p.timestamp || 0));
                
                if (latestTimestamp > this.lastEventTimestamp) {
                    console.log('DynamicMethodManager: New prototypes detected during token refresh');
                    this.lastEventTimestamp = latestTimestamp;
                    // Trigger method regeneration
                    await this.discoverAndRegenerateMethods();
                }
            }
        } catch (error) {
            // Silently fail during backup polling
        }
    }

    /**
     * Discover packages and regenerate methods (fallback approach)
     */
    private async discoverAndRegenerateMethods() {
        try {
            console.log('DynamicMethodManager: Starting fallback protocol discovery...');
            
            // Discover available packages using current approach
            const packages = await this.discoverPackages();
            console.log(`DynamicMethodManager: Discovered ${packages.length} packages:`, packages);
            
            // Always regenerate methods for all current packages to ensure consistency
            // This removes any stale protocols that are no longer deployed
            if (packages.length > 0) {
                console.log(`DynamicMethodManager: Regenerating methods for all current packages`);
                await this.generateMethodsForPackages(packages);
                this.knownPackages = new Set(packages);
            } else {
                console.log(`DynamicMethodManager: No packages found, clearing generated files`);
                // Clear generated files if no packages are available
                await this.saveGeneratedFiles([], {}, []);
                this.methodMappings = [];
                this.methodHandlers = {};
                this.knownPackages.clear();
            }
            
        } catch (error) {
            console.error('DynamicMethodManager: Fallback discovery failed:', error);
        }
    }

    /**
     * Discover all available packages in the NPL engine using technical user token
     */
    private async discoverPackages(): Promise<string[]> {
        const availablePackages: string[] = [];
        
        // Get a valid token for discovery (with refresh if needed)
        const discoveryToken = this.getValidToken();
        
        if (!discoveryToken) {
            console.warn('DynamicMethodManager: No token available for discovery');
            return [];
        }
        
        try {
            console.log('DynamicMethodManager: Attempting package discovery via direct testing...');
            
            // Known package names to check (from deployment history and current state)
            const candidatePackages = [
                'payment_workflow',
                'rfp_workflow',
                'test_auto_reload',
                'demo'
            ];
            
            // Test each candidate package directly
            for (const pkg of candidatePackages) {
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
                    } else {
                        console.log(`DynamicMethodManager: Package ${pkg} not available (${response.status})`);
                    }
                } catch (error) {
                    console.log(`DynamicMethodManager: Package ${pkg} verification failed:`, error instanceof Error ? error.message : String(error));
                    }
                }
                
            // Also check packages that are currently in knownPackages
            for (const pkg of this.knownPackages) {
                if (!candidatePackages.includes(pkg)) {
                    try {
                        const response = await fetch(`${this.NPL_ENGINE_URL}/npl/${pkg}/-/openapi.json`, {
                            headers: {
                                'Authorization': `Bearer ${discoveryToken}`,
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            availablePackages.push(pkg);
                            console.log(`DynamicMethodManager: Known package ${pkg} still available`);
                        } else {
                            console.log(`DynamicMethodManager: Known package ${pkg} no longer available (${response.status})`);
                        }
                    } catch (error) {
                        console.log(`DynamicMethodManager: Known package ${pkg} verification failed:`, error instanceof Error ? error.message : String(error));
                    }
                }
            }
            
            console.log(`DynamicMethodManager: Discovery complete. Found ${availablePackages.length} packages:`, availablePackages);
            return availablePackages;
            
        } catch (error) {
            console.warn('DynamicMethodManager: Package discovery failed:', error instanceof Error ? error.message : String(error));
            return [];
        }
    }

    /**
     * Regenerate methods for a specific package
     */
    public async regenerateMethodsForPackage(packageName: string) {
        try {
            console.log(`DynamicMethodManager: Regenerating methods for package ${packageName}...`);
            await this.generateMethodsForPackages([packageName]);
        } catch (error) {
            console.error(`DynamicMethodManager: Failed to regenerate methods for package ${packageName}:`, error);
        }
    }

    /**
     * Track a pending deployment and wait for event confirmation
     */
    public trackDeployment(packageName: string, protocolName: string) {
        const deploymentKey = `${packageName}.${protocolName}`;
        this.pendingDeployments.set(deploymentKey, {
            timestamp: Date.now(),
            retryCount: 0
        });
        
        console.log(`DynamicMethodManager: Tracking deployment: ${deploymentKey}`);
        
        // Set timeout to check if we missed the event
        setTimeout(() => {
            this.checkDeploymentConfirmation(deploymentKey);
        }, this.deploymentTimeout);
    }

    /**
     * Check if a deployment was confirmed by event stream
     */
    private async checkDeploymentConfirmation(deploymentKey: string) {
        const deployment = this.pendingDeployments.get(deploymentKey);
        if (!deployment) return; // Already confirmed
        
        console.log(`DynamicMethodManager: Deployment ${deploymentKey} not confirmed by event stream, checking status...`);
        
        // Try to redeploy to check if it's already deployed
        const [packageName, protocolName] = deploymentKey.split('.');
        const isDeployed = await this.checkIfProtocolDeployed(packageName, protocolName);
        
        if (isDeployed) {
            console.log(`DynamicMethodManager: Protocol ${deploymentKey} is deployed but event was missed, triggering method generation`);
            this.pendingDeployments.delete(deploymentKey);
            await this.regenerateMethodsForPackage(packageName);
        } else {
            console.log(`DynamicMethodManager: Protocol ${deploymentKey} not found, deployment may have failed`);
            // Could implement retry logic here if needed
            this.pendingDeployments.delete(deploymentKey);
        }
    }

    /**
     * Check if a protocol is deployed by querying the engine
     */
    private async checkIfProtocolDeployed(packageName: string, protocolName: string): Promise<boolean> {
            try {
            const token = this.getValidToken();
            if (!token) return false;
            
            // Try to get the protocol's OpenAPI spec
            const response = await fetch(`${this.NPL_ENGINE_URL}/npl/${packageName}/-/openapi.json`, {
                    headers: {
                    'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
            
                if (response.ok) {
                const openAPISpec = await response.json() as { paths?: { [key: string]: any } };
                // Check if the protocol exists in the OpenAPI spec
                const protocolPath = `/npl/${packageName}/${protocolName}/`;
                return Object.keys(openAPISpec.paths || {}).some(path => 
                    path.startsWith(protocolPath)
                );
            }
            
            return false;
        } catch (error) {
            console.error(`DynamicMethodManager: Error checking if ${packageName}.${protocolName} is deployed:`, error);
            return false;
                }
    }

    /**
     * Confirm deployment when event is received
     */
    private confirmDeployment(packageName: string, protocolName: string) {
        const deploymentKey = `${packageName}.${protocolName}`;
        if (this.pendingDeployments.has(deploymentKey)) {
            console.log(`DynamicMethodManager: Deployment confirmed by event stream: ${deploymentKey}`);
            this.pendingDeployments.delete(deploymentKey);
            return true;
            }
        return false;
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
                            'Authorization': `Bearer ${this.getValidToken()}`,
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
                    
                    console.log(`DynamicMethodManager: Generated ${packageMappings.length} mappings and ${Object.keys(packageHandlers).length} handlers for ${pkg}`);
                    
                } catch (error) {
                    console.error(`DynamicMethodManager: Failed to generate methods for package ${pkg}:`, error);
                }
            }
            
            if (allMappings.length > 0 || Object.keys(allHandlers).length > 0) {
                console.log(`DynamicMethodManager: Generated ${allMappings.length} mappings and ${Object.keys(allHandlers).length} handlers`);
                console.log(`DynamicMethodManager: Generated ${allSkills.length} protocol skills`);
                
                // Save generated files
                await this.saveGeneratedFiles(allMappings, allHandlers, allSkills);
                
                // Update in-memory mappings and handlers
            this.methodMappings = allMappings;
            this.methodHandlers = allHandlers;
            
                console.log('DynamicMethodManager: Method generation completed successfully');
            } else {
                console.log('DynamicMethodManager: No methods generated');
            }
            
        } catch (error) {
            console.error('DynamicMethodManager: Method generation failed:', error);
        }
    }

    /**
     * Save generated method files
     */
    private async saveGeneratedFiles(mappings: MethodMapping[], handlers: MethodHandlers, skills: ProtocolInfo[]) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            console.log('DynamicMethodManager: Saving generated files...');
            
            // Generate method-mappings.js content
            const mappingsContent = `
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
            
            // Generate method-handlers.js content
            const handlerEntries = Object.entries(handlers).map(([key, value]) => 
                `  "${key}": ${value.toString()}`
            ).join(',\n');
            
            const handlersContent = `
/**
 * Generated method handlers for NPL protocols
 * Each handler is a function that executes the corresponding NPL operation
 */
module.exports = {
${handlerEntries}
};
`;
            
            // Generate agent-skills.js content
            const skillsContent = `
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
            
            // Save files
            const basePath = process.cwd();
            
            fs.writeFileSync(path.join(basePath, 'src', 'method-mappings.js'), mappingsContent);
            fs.writeFileSync(path.join(basePath, 'src', 'method-handlers.js'), handlersContent);
            fs.writeFileSync(path.join(basePath, 'src', 'agent-skills.js'), skillsContent);
            
            console.log('DynamicMethodManager: Files saved successfully to /app/src');
            console.log(`DynamicMethodManager: - Mappings: ${mappings.length}`);
            console.log(`DynamicMethodManager: - Handlers: ${Object.keys(handlers).length}`);
            console.log(`DynamicMethodManager: - Skills: ${skills.length} protocols`);
            
            // Log skill details
            for (const skill of skills) {
                console.log(`DynamicMethodManager: - Skill: ${skill.protocol} (${skill.methods.length} methods)`);
            }
            
            // Clear require cache to force reload
            delete require.cache[require.resolve('./method-mappings')];
            delete require.cache[require.resolve('./method-handlers')];
            delete require.cache[require.resolve('./agent-skills')];
            
            console.log('DynamicMethodManager: Agent skills cache cleared, server will reload on next request');
            
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

            // Update in-memory mappings and handlers
            this.methodMappings = METHOD_MAPPINGS || [];
            this.methodHandlers = methodHandlersModule || {};

            console.log(`DynamicMethodManager: Loaded ${this.methodMappings.length} handlers and ${this.methodHandlers.length} mappings`);

        } catch (error) {
            console.warn('DynamicMethodManager: Failed to load methods:', error);
            this.methodMappings = [];
            this.methodHandlers = {};
        }
    }

    /**
     * Find method mapping for a specific package, protocol, and method
     */
    public findMethodMapping(pkg: string, protocol: string, method: string): MethodMapping | undefined {
        return this.methodMappings.find(m => m.package === pkg && m.protocol === protocol && m.method === method);
    }

    /**
     * Get all method mappings
     */
    public getAllMappings(): MethodMapping[] {
        return this.methodMappings;
    }

    /**
     * Get available operations count
     */
    public getAvailableOperations(): number {
        return this.methodMappings.length;
    }

    /**
     * Force immediate discovery and regeneration
     */
    public async forceDiscovery() {
        console.log('DynamicMethodManager: Forcing discovery and regeneration...');
        await this.discoverAndRegenerateMethods();
    }

    /**
     * Check if event stream is connected
     */
    public isConnected(): boolean {
        return this.isEventStreamConnected;
    }

    /**
     * Get detailed status of the dynamic method manager
     */
    public getStatus() {
        return {
            eventStreamConnected: this.isEventStreamConnected,
            tokenRefreshInProgress: this.isRefreshingToken,
            backupPollingActive: this.backupStreamActive,
            tokenExpiryTime: this.tokenExpiryTime,
            tokenExpiresIn: Math.max(0, this.tokenExpiryTime - Date.now()),
            lastEventTimestamp: this.lastEventTimestamp,
            knownPackages: Array.from(this.knownPackages),
            availableOperations: this.getAvailableOperations(),
            pendingDeployments: Array.from(this.pendingDeployments.entries()).map(([key, data]) => ({
                deployment: key,
                timestamp: data.timestamp,
                retryCount: data.retryCount,
                age: Date.now() - data.timestamp
            }))
        };
    }

    /**
     * Cleanup resources
     */
    public cleanup() {
        this.isEventStreamConnected = false;
        
        // Clear token refresh interval
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
    }
}

export default DynamicMethodManager; 
export const dynamicMethodManager = new DynamicMethodManager(); 