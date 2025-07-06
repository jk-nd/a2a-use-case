import { LLMClient } from './llm-client';
import axios from 'axios';

export interface NegotiationState {
  phase: 'initiation' | 'product_selection' | 'price_negotiation' | 'agreement' | 'payment_setup';
  currentProduct?: any;
  currentPrice?: number;
  budget: number;
  maxRounds: number;
  currentRound: number;
  conversationHistory: Array<{
    from: 'buyer' | 'seller';
    message: string;
    timestamp: Date;
  }>;
}

export interface NegotiationResult {
  success: boolean;
  product: any;
  finalPrice: number;
  conversationHistory: Array<any>;
  paymentWorkflowData?: any;
  error?: string;
}

export class NegotiationService {
  private llmClient: LLMClient;
  private a2aServerUrl: string;
  private sellerAgentUrl: string;

  constructor() {
    this.llmClient = new LLMClient();
    this.a2aServerUrl = process.env.A2A_HUB_URL || 'http://localhost:8000';
    this.sellerAgentUrl = process.env.SELLER_AGENT_URL || 'http://localhost:8002';
  }

  async handleIncomingMessage(message: string, fromAgentId: string): Promise<string> {
    console.log('🤖 Buyer Agent: Received message from', fromAgentId, ':', message);
    
    // For now, we'll use a simple response mechanism
    // In a full implementation, this would maintain conversation state
    const response = await this.llmClient.generateNegotiationResponse(message, 1200, 5000);
    return response;
  }

  async startNegotiation(budget: number = 5000): Promise<NegotiationResult> {
    console.log('🤖 Buyer Agent: Starting negotiation with budget $' + budget);
    
    const state: NegotiationState = {
      phase: 'initiation',
      budget,
      maxRounds: 5,
      currentRound: 0,
      conversationHistory: []
    };

    try {
      // Phase 1: Initiate conversation
      await this.addToHistory(state, 'buyer', 'Hello! I\'m looking to purchase a high-quality product. What do you have available?');
      
      // Phase 2: Get product offerings
      const productResponse = await this.sendMessageToSeller('I\'m interested in seeing your available products. What do you have?');
      await this.addToHistory(state, 'seller', productResponse);
      
      // Phase 3: Select a product and start negotiation
      const selection = await this.selectProduct(state);
      const selectedProduct = selection.product;
      if (!selectedProduct) {
        throw new Error('No suitable product found');
      }
      state.currentProduct = selectedProduct;
      state.phase = 'price_negotiation';
      
      // If seller already accepted, skip negotiation loop
      if (selection.sellerAccepted && selection.agreedPrice) {
        const paymentWorkflowData = await this.setupPaymentWorkflow(selectedProduct, selection.agreedPrice);
        return {
          success: true,
          product: selectedProduct,
          finalPrice: selection.agreedPrice,
          conversationHistory: state.conversationHistory,
          paymentWorkflowData
        };
      }
      
      // Phase 4: Negotiate price
      const negotiationResult = await this.negotiatePrice(state);
      if (!negotiationResult.success) {
        throw new Error('Price negotiation failed');
      }
      
      // Phase 5: Set up payment workflow
      let paymentWorkflowData = undefined;
      try {
        paymentWorkflowData = await this.setupPaymentWorkflow(selectedProduct, negotiationResult.finalPrice);
      } catch (err) {
        console.error('❌ Error setting up payment workflow:', err);
        return {
          success: false,
          product: selectedProduct,
          finalPrice: negotiationResult.finalPrice,
          conversationHistory: state.conversationHistory,
          paymentWorkflowData: undefined,
          error: 'Failed to set up payment workflow: ' + (err instanceof Error ? err.message : String(err))
        };
      }
      
      return {
        success: true,
        product: selectedProduct,
        finalPrice: negotiationResult.finalPrice,
        conversationHistory: state.conversationHistory,
        paymentWorkflowData
      };
      
    } catch (error) {
      console.error('Negotiation failed:', error);
      return {
        success: false,
        product: state.currentProduct || null,
        finalPrice: 0,
        conversationHistory: state.conversationHistory,
        paymentWorkflowData: undefined,
        error: error instanceof Error ? error.message : String(error)
      };
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

  private async sendMessageToSeller(message: string): Promise<string> {
    try {
      const response = await axios.post(`${this.sellerAgentUrl}/agents/message`, {
        fromAgentId: 'buyer-agent',
        toAgentId: 'seller-agent',
        content: message,
        type: 'negotiation'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.result.message || 'No response from seller';
    } catch (error) {
      console.error('Failed to send message to seller:', error);
      return 'I have several products available. What are you looking for?';
    }
  }

  private async selectProduct(state: NegotiationState): Promise<{product: any, sellerAccepted: boolean, agreedPrice?: number}> {
    const lastSellerMessage = state.conversationHistory
      .filter(h => h.from === 'seller')
      .pop()?.message || '';
    
    // Use LLM to decide which product to pursue
    const decision = await this.llmClient.decideOnPurchase(
      { description: lastSellerMessage },
      1200, // Example price
      state.budget
    );
    
    // For simplicity, we'll create a mock product based on the conversation
    const mockProduct = {
      id: 'laptop-premium',
      name: 'Premium Laptop',
      description: 'High-performance laptop with 16GB RAM, 512GB SSD, Intel i7 processor',
      basePrice: 1200,
      features: ['16GB RAM', '512GB SSD', 'Intel i7', '15.6" Display']
    };
    
    // Send the counter-offer message to the seller
    const offerPrice = Math.floor(mockProduct.basePrice * 0.9);
    const buyerMessage = `I'm interested in the ${mockProduct.name}. I can offer $${offerPrice} for it. This is within my budget.`;
    await this.addToHistory(state, 'buyer', buyerMessage);
    
    // Get seller response
    const sellerResponse = await this.sendMessageToSeller(buyerMessage);
    await this.addToHistory(state, 'seller', sellerResponse);
    
    // Check if seller accepted
    const acceptPhrases = [
      'accept',
      'let\'s proceed',
      'can work with',
      'deal',
      'agreed',
      'proceed',
      'fair offer',
      'confirmed',
      'go ahead',
      'sounds good',
      'okay',
      'ok',
      'yes',
      'sure'
    ];
    const sellerResponseLower = sellerResponse.toLowerCase();
    const sellerAccepted = acceptPhrases.some(phrase => sellerResponseLower.includes(phrase));
    return { product: mockProduct, sellerAccepted, agreedPrice: sellerAccepted ? offerPrice : undefined };
  }

  private async negotiatePrice(state: NegotiationState): Promise<{ success: boolean; finalPrice: number }> {
    let currentPrice = state.currentProduct.basePrice;
    let lastOfferedPrice = currentPrice;
    let round = 0;
    
    while (round < state.maxRounds && currentPrice > state.budget * 0.8) {
      round++;
      state.currentRound = round;
      
      // Send counter-offer
      const counterOffer = Math.floor(currentPrice * 0.9); // 10% discount
      lastOfferedPrice = counterOffer;
      const buyerMessage = `I can offer $${counterOffer} for the ${state.currentProduct.name}. This is within my budget.`;
      
      await this.addToHistory(state, 'buyer', buyerMessage);
      
      // Get seller response
      const sellerResponse = await this.sendMessageToSeller(buyerMessage);
      await this.addToHistory(state, 'seller', sellerResponse);
      
      // Check if seller accepted (robust)
      const acceptPhrases = [
        'accept',
        'let\'s proceed',
        'can work with',
        'deal',
        'agreed',
        'proceed',
        'fair offer',
        'confirmed',
        'go ahead',
        'sounds good',
        'okay',
        'ok',
        'yes',
        'sure'
      ];
      const sellerResponseLower = sellerResponse.toLowerCase();
      if (acceptPhrases.some(phrase => sellerResponseLower.includes(phrase))) {
        // Use the last offered price as the final price
        await this.addToHistory(state, 'buyer', 'Excellent! I accept. Let\'s proceed with the payment workflow.');
        return { success: true, finalPrice: lastOfferedPrice };
      }
      
      // Extract new price from seller response
      const priceMatch = sellerResponse.match(/\$(\d+)/);
      if (priceMatch) {
        currentPrice = parseInt(priceMatch[1]);
        lastOfferedPrice = currentPrice;
      } else {
        // If no price mentioned, assume a small reduction
        currentPrice = Math.floor(currentPrice * 0.95);
      }
      
      // Check if we can afford it
      if (currentPrice <= state.budget) {
        await this.addToHistory(state, 'buyer', `I can work with $${currentPrice}. Let\'s proceed!`);
        return { success: true, finalPrice: currentPrice };
      }
    }
    
    return { success: false, finalPrice: 0 };
  }

  private async setupPaymentWorkflow(product: any, finalPrice: number): Promise<any> {
    console.log('💳 Setting up payment workflow for', product.name, 'at $' + finalPrice);
    
    try {
      // Create payment workflow data
      const paymentData = {
        product: product,
        amount: finalPrice,
        buyer: 'buyer-agent',
        seller: 'seller-agent',
        timestamp: new Date().toISOString()
      };
      
      // In a real implementation, you would:
      // 1. Call the A2A server to deploy the payment workflow
      // 2. Instantiate the payment protocol
      // 3. Execute the payment steps
      
      console.log('✅ Payment workflow data prepared:', paymentData);
      return paymentData;
      
    } catch (error) {
      console.error('Failed to setup payment workflow:', error);
      throw error;
    }
  }
} 