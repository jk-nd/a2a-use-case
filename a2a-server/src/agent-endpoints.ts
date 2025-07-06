import { Router, Request, Response } from 'express';
import { 
  AgentRegistrationRequest, 
  AgentMessageRequest, 
  AgentCollaborationRequest,
  AgentDiscoveryRequest
} from './types';
import { AgentRegistry } from './agent-registry';
import { AgentCommunication } from './agent-communication';

/**
 * Agent Endpoints - Express router for agent registration and communication
 */
export class AgentEndpoints {
  private router: Router;

  constructor(
    private agentRegistry: AgentRegistry,
    private agentCommunication: AgentCommunication
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Get the Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Setup all agent-related routes
   */
  private setupRoutes(): void {
    // Agent Registration
    this.router.post('/register', this.registerAgent.bind(this));
    this.router.delete('/register/:agentId', this.unregisterAgent.bind(this));
    this.router.post('/heartbeat/:agentId', this.updateHeartbeat.bind(this));

    // Agent Discovery
    this.router.get('/discover', this.discoverAgents.bind(this));
    this.router.get('/agents', this.getAllAgents.bind(this));
    this.router.get('/agents/:agentId', this.getAgent.bind(this));
    this.router.get('/agents/:agentId/health', this.getAgentHealth.bind(this));

    // Agent Communication
    this.router.post('/message', this.sendMessage.bind(this));
    this.router.post('/collaborate', this.startCollaboration.bind(this));
    this.router.get('/messages/:agentId', this.getMessageHistory.bind(this));
    this.router.get('/conversation/:agentId1/:agentId2', this.getConversation.bind(this));

    // Statistics and Monitoring
    this.router.get('/stats/registry', this.getRegistryStats.bind(this));
    this.router.get('/stats/communication', this.getCommunicationStats.bind(this));
  }

  /**
   * Register a new agent
   */
  private async registerAgent(req: Request, res: Response): Promise<void> {
    try {
      const request: AgentRegistrationRequest = req.body;
      
      // Validate required fields
      if (!request.agent || !request.agent.name || !request.agent.url) {
        res.status(400).json({
          error: 'Missing required fields: agent.name and agent.url are required'
        });
        return;
      }

      const response = await this.agentRegistry.registerAgent(request);
      
      if (response.status === 'registered') {
        res.status(201).json(response);
      } else {
        res.status(409).json(response);
      }
    } catch (error) {
      console.error('❌ Agent registration endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error during agent registration'
      });
    }
  }

  /**
   * Unregister an agent
   */
  private async unregisterAgent(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      const success = await this.agentRegistry.unregisterAgent(agentId);
      
      if (success) {
        res.status(200).json({ message: 'Agent unregistered successfully' });
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (error) {
      console.error('❌ Agent unregistration endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error during agent unregistration'
      });
    }
  }

  /**
   * Update agent heartbeat
   */
  private async updateHeartbeat(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      const success = await this.agentRegistry.updateHeartbeat(agentId);
      
      if (success) {
        res.status(200).json({ message: 'Heartbeat updated successfully' });
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (error) {
      console.error('❌ Heartbeat update endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error during heartbeat update'
      });
    }
  }

  /**
   * Discover agents based on criteria
   */
  private async discoverAgents(req: Request, res: Response): Promise<void> {
    try {
      const request: AgentDiscoveryRequest = {
        organization: req.query.organization as string,
        capabilities: req.query.capabilities ? 
          (req.query.capabilities as string).split(',') : undefined,
        skills: req.query.skills ? 
          (req.query.skills as string).split(',') : undefined,
        tags: req.query.tags ? 
          (req.query.tags as string).split(',') : undefined
      };

      const response = await this.agentRegistry.discoverAgents(request);
      res.status(200).json(response);
    } catch (error) {
      console.error('❌ Agent discovery endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error during agent discovery'
      });
    }
  }

  /**
   * Get all registered agents
   */
  private async getAllAgents(req: Request, res: Response): Promise<void> {
    try {
      const agents = await this.agentRegistry.getAllAgents();
      res.status(200).json({
        agents,
        total: agents.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Get all agents endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving agents'
      });
    }
  }

  /**
   * Get a specific agent by ID
   */
  private async getAgent(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      const agent = await this.agentRegistry.getAgent(agentId);
      
      if (agent) {
        res.status(200).json(agent);
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (error) {
      console.error('❌ Get agent endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving agent'
      });
    }
  }

  /**
   * Get agent health status
   */
  private async getAgentHealth(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      
      const health = await this.agentRegistry.getAgentHealth(agentId);
      
      if (health) {
        res.status(200).json(health);
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    } catch (error) {
      console.error('❌ Get agent health endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving agent health'
      });
    }
  }

  /**
   * Send a message to another agent
   */
  private async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { fromAgentId, ...messageRequest } = req.body;
      
      if (!fromAgentId) {
        res.status(400).json({
          error: 'fromAgentId is required'
        });
        return;
      }

      const request: AgentMessageRequest = messageRequest;
      const response = await this.agentCommunication.sendMessage(fromAgentId, request);
      
      if (response.status === 'delivered') {
        res.status(200).json(response);
      } else if (response.status === 'pending') {
        res.status(202).json(response);
      } else {
        res.status(400).json(response);
      }
    } catch (error) {
      console.error('❌ Send message endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error sending message'
      });
    }
  }

  /**
   * Start a collaboration with another agent
   */
  private async startCollaboration(req: Request, res: Response): Promise<void> {
    try {
      const { fromAgentId, ...collaborationRequest } = req.body;
      
      if (!fromAgentId) {
        res.status(400).json({
          error: 'fromAgentId is required'
        });
        return;
      }

      const request: AgentCollaborationRequest = collaborationRequest;
      const response = await this.agentCommunication.startCollaboration(fromAgentId, request);
      
      if (response.status === 'accepted') {
        res.status(200).json(response);
      } else if (response.status === 'pending') {
        res.status(202).json(response);
      } else {
        res.status(400).json(response);
      }
    } catch (error) {
      console.error('❌ Start collaboration endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error starting collaboration'
      });
    }
  }

  /**
   * Get message history for an agent
   */
  private async getMessageHistory(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const messages = await this.agentCommunication.getMessageHistory(agentId, limit);
      
      res.status(200).json({
        messages,
        total: messages.length,
        agentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Get message history endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving message history'
      });
    }
  }

  /**
   * Get conversation between two agents
   */
  private async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const { agentId1, agentId2 } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const messages = await this.agentCommunication.getConversation(agentId1, agentId2, limit);
      
      res.status(200).json({
        messages,
        total: messages.length,
        participants: [agentId1, agentId2],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Get conversation endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving conversation'
      });
    }
  }

  /**
   * Get registry statistics
   */
  private async getRegistryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.agentRegistry.getRegistryStats();
      res.status(200).json({
        ...stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Get registry stats endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving registry statistics'
      });
    }
  }

  /**
   * Get communication statistics
   */
  private async getCommunicationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.agentCommunication.getCommunicationStats();
      res.status(200).json({
        ...stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Get communication stats endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error retrieving communication statistics'
      });
    }
  }
} 