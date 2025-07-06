import { 
  AgentRegistration, 
  AgentRegistrationRequest, 
  AgentRegistrationResponse,
  AgentDiscoveryRequest,
  AgentDiscoveryResponse,
  AgentHealthStatus
} from './types';

/**
 * Agent Registry - manages agent registrations and discovery
 */
export class AgentRegistry {
  private agents: Map<string, AgentRegistration> = new Map();
  private heartbeatInterval: number = 30000; // 30 seconds
  private heartbeatTimeoutThreshold: number = 120000; // 2 minutes

  constructor() {
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();
  }

  /**
   * Register a new agent
   */
  async registerAgent(request: AgentRegistrationRequest): Promise<AgentRegistrationResponse> {
    try {
      // Generate unique agent ID
      const agentId = this.generateAgentId(request.agent.name, request.agent.organization);
      
      // Check if agent already exists
      if (this.agents.has(agentId)) {
        return {
          agentId,
          status: 'rejected',
          message: 'Agent with this ID already exists',
          registeredAt: new Date().toISOString()
        };
      }

      // Create agent registration
      const now = new Date().toISOString();
      const registration: AgentRegistration = {
        agentId,
        ...request.agent,
        registeredAt: now,
        lastHeartbeat: now,
        status: 'active'
      };

      // Store the registration
      this.agents.set(agentId, registration);

      console.log(`✅ Agent registered: ${agentId} (${request.agent.name})`);

      return {
        agentId,
        status: 'registered',
        message: 'Agent successfully registered',
        registeredAt: now
      };
    } catch (error) {
      console.error('❌ Agent registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return false;
      }

      this.agents.delete(agentId);
      console.log(`✅ Agent unregistered: ${agentId} (${agent.name})`);
      return true;
    } catch (error) {
      console.error('❌ Agent unregistration failed:', error);
      return false;
    }
  }

  /**
   * Update agent heartbeat
   */
  async updateHeartbeat(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return false;
      }

      agent.lastHeartbeat = new Date().toISOString();
      agent.status = 'active';
      this.agents.set(agentId, agent);
      return true;
    } catch (error) {
      console.error('❌ Heartbeat update failed:', error);
      return false;
    }
  }

  /**
   * Discover agents based on criteria
   */
  async discoverAgents(request: AgentDiscoveryRequest = {}): Promise<AgentDiscoveryResponse> {
    try {
      let filteredAgents = Array.from(this.agents.values());

      // Filter by organization
      if (request.organization) {
        filteredAgents = filteredAgents.filter(agent => 
          agent.organization.toLowerCase().includes(request.organization!.toLowerCase())
        );
      }

      // Filter by capabilities
      if (request.capabilities && request.capabilities.length > 0) {
        filteredAgents = filteredAgents.filter(agent => {
          const agentCapabilities = Object.keys(agent.capabilities);
          return request.capabilities!.some(cap => 
            agentCapabilities.some(agentCap => 
              agentCap.toLowerCase().includes(cap.toLowerCase())
            )
          );
        });
      }

      // Filter by skills
      if (request.skills && request.skills.length > 0) {
        filteredAgents = filteredAgents.filter(agent => {
          const agentSkills = agent.skills.map((skill: any) => {
            // Handle both string and object skill formats
            if (typeof skill === 'string') {
              return skill.toLowerCase();
            } else if (skill && typeof skill === 'object' && skill.name) {
              return skill.name.toLowerCase();
            }
            return '';
          }).filter(skill => skill !== '');
          
          return request.skills!.some(skill => 
            agentSkills.some(agentSkill => 
              agentSkill.includes(skill.toLowerCase())
            )
          );
        });
      }

      // Filter by tags
      if (request.tags && request.tags.length > 0) {
        filteredAgents = filteredAgents.filter(agent => {
          const agentTags = agent.skills.flatMap((skill: any) => {
            // Handle both string and object skill formats
            if (typeof skill === 'string') {
              return []; // String skills don't have tags
            } else if (skill && typeof skill === 'object' && skill.tags) {
              return skill.tags;
            }
            return [];
          });
          
          return request.tags!.some(tag => 
            agentTags.some(agentTag => 
              agentTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
        });
      }

      // Only return active agents
      filteredAgents = filteredAgents.filter(agent => agent.status === 'active');

      return {
        agents: filteredAgents,
        total: filteredAgents.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Agent discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AgentRegistration | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<AgentRegistration[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent health status
   */
  async getAgentHealth(agentId: string): Promise<AgentHealthStatus | null> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return null;
    }

    const now = new Date().getTime();
    const lastHeartbeat = new Date(agent.lastHeartbeat).getTime();
    const timeSinceHeartbeat = now - lastHeartbeat;

    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    let message: string;

    if (timeSinceHeartbeat < this.heartbeatInterval * 2) {
      status = 'healthy';
      message = 'Agent is responding normally';
    } else if (timeSinceHeartbeat < this.heartbeatTimeoutThreshold) {
      status = 'degraded';
      message = 'Agent heartbeat is delayed';
    } else {
      status = 'unhealthy';
      message = 'Agent has not responded recently';
    }

    return {
      agentId,
      status,
      message,
      lastCheck: new Date().toISOString(),
      metrics: {
        responseTime: timeSinceHeartbeat
      }
    };
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<{
    totalAgents: number;
    activeAgents: number;
    inactiveAgents: number;
    organizations: string[];
    skills: string[];
  }> {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter(a => a.status === 'active');
    const inactiveAgents = agents.filter(a => a.status !== 'active');
    
    const organizations = [...new Set(agents.map(a => a.organization))];
    const skills = [...new Set(agents.flatMap(a => a.skills.map((s: any) => {
      if (typeof s === 'string') {
        return s;
      } else if (s && typeof s === 'object' && s.name) {
        return s.name;
      }
      return '';
    }).filter(s => s !== '')))];

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      inactiveAgents: inactiveAgents.length,
      organizations,
      skills
    };
  }

  /**
   * Generate a unique agent ID
   */
  private generateAgentId(name: string, organization: string): string {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sanitizedOrg = organization.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${sanitizedOrg}-${sanitizedName}-${timestamp}`;
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      this.checkAgentHeartbeats();
    }, this.heartbeatInterval);
  }

  /**
   * Check agent heartbeats and update status
   */
  private checkAgentHeartbeats(): void {
    const now = new Date().getTime();
    
    for (const [agentId, agent] of this.agents.entries()) {
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;

      if (timeSinceHeartbeat > this.heartbeatTimeoutThreshold) {
        if (agent.status === 'active') {
          agent.status = 'inactive';
          this.agents.set(agentId, agent);
          console.log(`⚠️  Agent ${agentId} marked as inactive (no heartbeat for ${Math.round(timeSinceHeartbeat / 1000)}s)`);
        }
      }
    }
  }
} 