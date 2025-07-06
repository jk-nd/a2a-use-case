import { LLMClient, Product } from './llm-client';
import axios from 'axios';

export interface NegotiationState {
  phase: 'waiting' | 'product_offering' | 'price_negotiation' | 'agreement' | 'payment_setup';
  currentProduct?: Product;
  currentPrice?: number;
  conversationHistory: Array<{
    from: 'buyer' | 'seller';
    message: string;
    timestamp: Date;
  }>;
  customerPreferences?: any;
}

export interface NegotiationResult {
  success: boolean;
  product: Product;
  finalPrice: number;
  conversationHistory: Array<any>;
  paymentWorkflowData?: any;
}

export class NegotiationService {
  private llmClient: LLMClient;
  private a2aServerUrl: string;
  private buyerAgentUrl: string;

  constructor() {
    this.llmClient = new LLMClient();
    this.a2aServerUrl = process.env.A2A_HUB_URL || 'http://localhost:8000';
    this.buyerAgentUrl = process.env.BUYER_AGENT_URL || 'http://localhost:8001';
  }

  async handleIncomingMessage(message: string, fromAgentId: string): Promise<string> {
    console.log('🤖 Seller Agent: Received message from', fromAgentId, ':', message);
    
    const state: NegotiationState = {
      phase: 'waiting',
      conversationHistory: []
    };

    try {
      // Add the incoming message to history
      await this.addToHistory(state, 'buyer', message);
      
      // If the message contains a price offer, respond with negotiation logic
      const priceMatch = message.match(/\$(\d+)/);
      if (priceMatch) {
        const offeredPrice = parseInt(priceMatch[1]);
        // Use the first product for simplicity
        const product = this.llmClient.getProducts()[0];
        const negotiation = await this.llmClient.negotiatePrice(offeredPrice, product);
        switch (negotiation.decision) {
          case 'accept':
            return `I can work with $${offeredPrice}. That's a fair offer for the ${product.name}. Let's proceed!`;
          case 'counter':
            return `I appreciate your offer of $${offeredPrice}, but I need at least $${negotiation.counterOffer} for the ${product.name}. This is still a great value!`;
          case 'reject':
            return `I'm sorry, but $${offeredPrice} is below my minimum price for the ${product.name}. My best price is $${product.minPrice}.`;
          default:
            return negotiation.reasoning;
        }
      }
      
      // Analyze the message and respond appropriately
      if (message.toLowerCase().includes('product') || message.toLowerCase().includes('available') || message.toLowerCase().includes('have')) {
        return await this.offerProducts(state);
      }
      
      if (message.toLowerCase().includes('negotiate') || message.toLowerCase().includes('discount')) {
        return await this.handleNegotiation(message, state);
      }
      
      if (message.toLowerCase().includes('accept') || message.toLowerCase().includes('proceed')) {
        return await this.handleAgreement(message, state);
      }
      
      // Default response
      return await this.generateDefaultResponse(message, state);
      
    } catch (error) {
      console.error('Failed to handle incoming message:', error);
      return 'I apologize, but I\'m having trouble processing your request. Could you please rephrase?';
    }
  }

  private async addToHistory(state: NegotiationState, from: 'buyer' | 'seller', message: string) {
    state.conversationHistory.push({
      from,
      message,
      timestamp: new Date()
    });
    console.log(`💬 ${from.toUpperCase()}: ${message}`);
  }

  private async offerProducts(state: NegotiationState): Promise<string> {
    const products = this.llmClient.getProducts();
    const selectedProduct = products[0]; // For simplicity, always offer the first product
    
    state.currentProduct = selectedProduct;
    state.phase = 'product_offering';
    
    const response = `I have a ${selectedProduct.name} available for $${selectedProduct.basePrice}. ${selectedProduct.description}. Features include: ${selectedProduct.features.join(', ')}. Would you like to know more about this product?`;
    
    await this.addToHistory(state, 'seller', response);
    return response;
  }

  private async handleNegotiation(message: string, state: NegotiationState): Promise<string> {
    if (!state.currentProduct) {
      return await this.offerProducts(state);
    }
    
    const response = 'I\'m willing to work with you on pricing. What\'s your target price? I want to make sure we can find a price that works for both of us.';
    await this.addToHistory(state, 'seller', response);
    return response;
  }

  private async handleAgreement(message: string, state: NegotiationState): Promise<string> {
    const response = 'Excellent! I accept your offer. Let\'s proceed with the payment workflow to complete the transaction.';
    state.phase = 'payment_setup';
    await this.addToHistory(state, 'seller', response);
    return response;
  }

  private async generateDefaultResponse(message: string, state: NegotiationState): Promise<string> {
    const response = await this.llmClient.generateResponse({
      messages: [
        { role: 'system', content: 'You are a seller agent with quality products. Be helpful and professional.' },
        { role: 'user', content: message }
      ]
    });
    
    await this.addToHistory(state, 'seller', response);
    return response;
  }

  async initiateProductShowcase(): Promise<string> {
    const products = this.llmClient.getProducts();
    const showcaseMessage = `Welcome! I have ${products.length} high-quality products available:
    
${products.map(p => `- ${p.name}: $${p.basePrice} (${p.description})`).join('\n')}

What type of product are you looking for? I can help you find the perfect match for your needs.`;

    return showcaseMessage;
  }

  async getProductRecommendations(customerRequest: string): Promise<{
    product: Product;
    reasoning: string;
  }> {
    return await this.llmClient.selectProductForCustomer(customerRequest);
  }
} 