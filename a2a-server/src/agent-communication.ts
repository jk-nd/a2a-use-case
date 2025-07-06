import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentMessage, 
  AgentMessageRequest, 
  AgentMessageResponse,
  AgentCollaborationRequest,
  AgentCollaborationResponse,
  AgentRegistration
} from './types';
import { AgentRegistry } from './agent-registry';

/**
 * Agent Communication - handles messaging between agents
 */
export class AgentCommunication {
  private messages: Map<string, AgentMessage> = new Map();
  private pendingResponses: Map<string, (response: any) => void> = new Map();
  private responseTimeout: number = 30000; // 30 seconds

  constructor(private agentRegistry: AgentRegistry) {}

  /**
   * Send a message to another agent
   */
  async sendMessage(
    fromAgentId: string, 
    request: AgentMessageRequest
  ): Promise<AgentMessageResponse> {
    try {
      // Validate sender agent
      const senderAgent = await this.agentRegistry.getAgent(fromAgentId);
      if (!senderAgent) {
        throw new Error(`Sender agent ${fromAgentId} not found`);
      }

      // Validate recipient agent
      const recipientAgent = await this.agentRegistry.getAgent(request.toAgentId);
      if (!recipientAgent) {
        return {
          messageId: '',
          status: 'failed',
          error: `Recipient agent ${request.toAgentId} not found`
        };
      }

      // Check if recipient is active
      if (recipientAgent.status !== 'active') {
        return {
          messageId: '',
          status: 'failed',
          error: `Recipient agent ${request.toAgentId} is not active`
        };
      }

      // Create message
      const messageId = uuidv4();
      const message: AgentMessage = {
        id: messageId,
        fromAgentId,
        toAgentId: request.toAgentId,
        type: request.type,
        content: request.content,
        timestamp: new Date().toISOString(),
        correlationId: request.correlationId,
        metadata: request.metadata
      };

      // Store message
      this.messages.set(messageId, message);

      // Handle different message types
      switch (request.type) {
        case 'request':
          return await this.sendRequestMessage(message, recipientAgent);
        case 'notification':
          return await this.sendNotificationMessage(message, recipientAgent);
        case 'broadcast':
          return await this.sendBroadcastMessage(message);
        default:
          throw new Error(`Unsupported message type: ${request.type}`);
      }
    } catch (error) {
      console.error('❌ Message sending failed:', error);
      return {
        messageId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a request message (expects response)
   */
  private async sendRequestMessage(
    message: AgentMessage, 
    recipientAgent: AgentRegistration
  ): Promise<AgentMessageResponse> {
    try {
      // Prepare request payload
      const requestPayload = {
        jsonrpc: '2.0',
        id: message.id,
        method: 'agent.message',
        params: {
          message: message
        }
      };

      // Send HTTP request to recipient agent
      const response = await axios.post(recipientAgent.url, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'A2A-Server/1.0'
        },
        timeout: this.responseTimeout
      });

      // Handle response
      if (response.data && response.data.result) {
        return {
          messageId: message.id,
          status: 'delivered',
          response: response.data.result
        };
      } else {
        return {
          messageId: message.id,
          status: 'delivered',
          response: response.data
        };
      }
    } catch (error) {
      console.error(`❌ Request message failed to ${recipientAgent.agentId}:`, error);
      return {
        messageId: message.id,
        status: 'failed',
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Send a notification message (no response expected)
   */
  private async sendNotificationMessage(
    message: AgentMessage, 
    recipientAgent: AgentRegistration
  ): Promise<AgentMessageResponse> {
    try {
      // Prepare notification payload
      const notificationPayload = {
        jsonrpc: '2.0',
        method: 'agent.notification',
        params: {
          message: message
        }
      };

      // Send HTTP request to recipient agent
      await axios.post(recipientAgent.url, notificationPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'A2A-Server/1.0'
        },
        timeout: this.responseTimeout
      });

      return {
        messageId: message.id,
        status: 'delivered'
      };
    } catch (error) {
      console.error(`❌ Notification message failed to ${recipientAgent.agentId}:`, error);
      return {
        messageId: message.id,
        status: 'failed',
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Send a broadcast message to all active agents
   */
  private async sendBroadcastMessage(message: AgentMessage): Promise<AgentMessageResponse> {
    try {
      const allAgents = await this.agentRegistry.getAllAgents();
      const activeAgents = allAgents.filter(agent => 
        agent.status === 'active' && agent.agentId !== message.fromAgentId
      );

      const results = await Promise.allSettled(
        activeAgents.map(agent => this.sendNotificationMessage(message, agent))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      return {
        messageId: message.id,
        status: failureCount === 0 ? 'delivered' : 'pending',
        response: {
          totalRecipients: activeAgents.length,
          successCount,
          failureCount
        }
      };
    } catch (error) {
      console.error('❌ Broadcast message failed:', error);
      return {
        messageId: message.id,
        status: 'failed',
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Start a collaboration with another agent
   */
  async startCollaboration(
    fromAgentId: string, 
    request: AgentCollaborationRequest
  ): Promise<AgentCollaborationResponse> {
    try {
      // Validate sender agent
      const senderAgent = await this.agentRegistry.getAgent(fromAgentId);
      if (!senderAgent) {
        throw new Error(`Sender agent ${fromAgentId} not found`);
      }

      // Validate target agent
      const targetAgent = await this.agentRegistry.getAgent(request.targetAgentId);
      if (!targetAgent) {
        throw new Error(`Target agent ${request.targetAgentId} not found`);
      }

      // Check if target is active
      if (targetAgent.status !== 'active') {
        throw new Error(`Target agent ${request.targetAgentId} is not active`);
      }

      // Generate collaboration ID
      const collaborationId = uuidv4();

      // Send collaboration request
      const messageRequest: AgentMessageRequest = {
        toAgentId: request.targetAgentId,
        type: 'request',
        content: {
          type: 'collaboration_request',
          collaborationId,
          collaborationType: request.type,
          details: request.details
        },
        metadata: request.metadata
      };

      const response = await this.sendMessage(fromAgentId, messageRequest);

      if (response.status === 'delivered' && response.response) {
        return {
          collaborationId,
          status: response.response.status || 'pending',
          message: response.response.message,
          details: response.response.details
        };
      } else {
        return {
          collaborationId,
          status: 'rejected',
          message: response.error || 'Failed to establish collaboration'
        };
      }
    } catch (error) {
      console.error('❌ Collaboration start failed:', error);
      return {
        collaborationId: '',
        status: 'rejected',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get message history for an agent
   */
  async getMessageHistory(
    agentId: string, 
    limit: number = 50
  ): Promise<AgentMessage[]> {
    try {
      const messages = Array.from(this.messages.values())
        .filter(msg => msg.fromAgentId === agentId || msg.toAgentId === agentId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return messages;
    } catch (error) {
      console.error('❌ Message history retrieval failed:', error);
      return [];
    }
  }

  /**
   * Get conversation between two agents
   */
  async getConversation(
    agentId1: string, 
    agentId2: string, 
    limit: number = 50
  ): Promise<AgentMessage[]> {
    try {
      const messages = Array.from(this.messages.values())
        .filter(msg => 
          (msg.fromAgentId === agentId1 && msg.toAgentId === agentId2) ||
          (msg.fromAgentId === agentId2 && msg.toAgentId === agentId1)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, limit);

      return messages;
    } catch (error) {
      console.error('❌ Conversation retrieval failed:', error);
      return [];
    }
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats(): Promise<{
    totalMessages: number;
    messagesByType: { [type: string]: number };
    messagesByStatus: { [status: string]: number };
    activeConversations: number;
  }> {
    try {
      const messages = Array.from(this.messages.values());
      
      const messagesByType = messages.reduce((acc, msg) => {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
        return acc;
      }, {} as { [type: string]: number });

      // Count unique agent pairs for active conversations
      const agentPairs = new Set(
        messages.map(msg => [msg.fromAgentId, msg.toAgentId].sort().join('-'))
      );

      return {
        totalMessages: messages.length,
        messagesByType,
        messagesByStatus: {
          delivered: messages.length, // Simplified for now
          pending: 0,
          failed: 0
        },
        activeConversations: agentPairs.size
      };
    } catch (error) {
      console.error('❌ Communication stats retrieval failed:', error);
      return {
        totalMessages: 0,
        messagesByType: {},
        messagesByStatus: {},
        activeConversations: 0
      };
    }
  }

  /**
   * Clean up old messages
   */
  async cleanupOldMessages(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - maxAge);
      let deletedCount = 0;

      for (const [messageId, message] of this.messages.entries()) {
        if (new Date(message.timestamp) < cutoffTime) {
          this.messages.delete(messageId);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old messages`);
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Message cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof AxiosError) {
      if (error.response) {
        return `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        return 'Network error: No response received';
      } else {
        return `Request error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'Unknown error occurred';
    }
  }
} 