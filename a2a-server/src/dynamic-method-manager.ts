import { readFileSync, existsSync } from 'fs';
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

class DynamicMethodManager {
    private methodMappings: MethodMapping[] = [];
    private methodHandlers: MethodHandlers = {};
    private lastRefresh = 0;
    private refreshInterval = 5000; // 5 seconds

    constructor() {
        this.loadMethods();
    }

    /**
     * Load method mappings and handlers dynamically
     */
    private loadMethods() {
        try {
            // Determine the correct paths based on whether we're in src or dist
            const isCompiled = __dirname.includes('dist');
            const basePath = isCompiled ? join(__dirname, '..', 'src') : __dirname;
            
            const methodMappingsPath = join(basePath, 'method-mappings');
            const methodHandlersPath = join(basePath, 'method-handlers');

            // Clear require cache to force reload
            delete require.cache[require.resolve(methodMappingsPath)];
            delete require.cache[require.resolve(methodHandlersPath)];

            // Load fresh modules
            const { findMethodMapping } = require(methodMappingsPath);
            const methodHandlersModule = require(methodHandlersPath);

            // Extract all exported functions as handlers
            this.methodHandlers = {};
            for (const [key, value] of Object.entries(methodHandlersModule)) {
                if (typeof value === 'function') {
                    this.methodHandlers[key] = value as (params: any) => Promise<any>;
                }
            }

            // Load mappings
            const { METHOD_MAPPINGS } = require(methodMappingsPath);
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
     * Find method mapping
     */
    public findMethodMapping(pkg: string, protocol: string, method: string): MethodMapping | undefined {
        this.checkAndRefresh();
        return this.methodMappings.find(m => 
            m.package === pkg && 
            m.protocol === protocol && 
            m.method === method.toLowerCase()
        );
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