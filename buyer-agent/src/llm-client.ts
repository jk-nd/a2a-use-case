import axios from 'axios';

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class LLMClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // For simplicity, we'll use a mock LLM that simulates intelligent responses
    // In production, you'd use OpenAI, Anthropic, or another LLM provider
    this.apiKey = process.env.LLM_API_KEY || 'mock-key';
    this.baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  }

  async generateResponse(request: LLMRequest): Promise<string> {
    try {
      // For demo purposes, we'll simulate intelligent responses
      // In production, replace this with actual LLM API calls
      return this.simulateLLMResponse(request);
    } catch (error) {
      console.error('LLM request failed:', error);
      return this.getFallbackResponse(request);
    }
  }

  private simulateLLMResponse(request: LLMRequest): string {
    const lastMessage = request.messages[request.messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    // Simulate buyer agent behavior
    if (content.includes('buy') || content.includes('purchase')) {
      if (content.includes('budget')) {
        return 'I have a budget of $5000 for this purchase. I\'m looking for the best value within this range.';
      }
      if (content.includes('price') || content.includes('cost')) {
        return 'I\'m interested in getting the best price possible. What\'s your best offer?';
      }
      return 'I\'m looking to purchase a high-quality product. What do you have available?';
    }

    if (content.includes('negotiate') || content.includes('offer')) {
      if (content.includes('$')) {
        // Extract price from message and counter-offer
        const priceMatch = content.match(/\$(\d+)/);
        if (priceMatch) {
          const offeredPrice = parseInt(priceMatch[1]);
          const counterOffer = Math.floor(offeredPrice * 0.85); // 15% discount
          return `I appreciate the offer of $${offeredPrice}, but I can offer $${counterOffer}. This is within my budget and provides good value.`;
        }
      }
      return 'I\'m willing to negotiate on price. What\'s your best offer?';
    }

    if (content.includes('agree') || content.includes('accept')) {
      return 'I accept this offer. Let\'s proceed with the payment workflow.';
    }

    return 'I\'m a buyer agent looking for the best deal. What products do you have available?';
  }

  private getFallbackResponse(request: LLMRequest): string {
    return 'I\'m a buyer agent. I\'m interested in purchasing products at the best possible price.';
  }

  // Specific methods for buyer agent
  async decideOnPurchase(productInfo: any, offeredPrice: number, budget: number): Promise<{
    decision: 'accept' | 'negotiate' | 'reject';
    reasoning: string;
    counterOffer?: number;
  }> {
    const prompt = `As a buyer agent with a budget of $${budget}, evaluate this product:
    Product: ${JSON.stringify(productInfo)}
    Offered Price: $${offeredPrice}
    Budget: $${budget}
    
    Decide whether to:
    1. Accept the offer (if price is good and within budget)
    2. Negotiate (if price is close but could be better)
    3. Reject (if price is too high or product doesn't meet requirements)
    
    Respond with your decision and reasoning.`;

    const response = await this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a buyer agent focused on getting the best value for money.' },
        { role: 'user', content: prompt }
      ]
    });

    // Parse the response to extract decision
    if (response.toLowerCase().includes('accept')) {
      return { decision: 'accept', reasoning: response };
    } else if (response.toLowerCase().includes('negotiate')) {
      const counterOffer = Math.floor(offeredPrice * 0.9); // 10% discount
      return { decision: 'negotiate', reasoning: response, counterOffer };
    } else {
      return { decision: 'reject', reasoning: response };
    }
  }

  async generateNegotiationResponse(sellerMessage: string, currentOffer: number, budget: number): Promise<string> {
    const prompt = `The seller says: "${sellerMessage}"
    Current offer: $${currentOffer}
    Your budget: $${budget}
    
    Respond as a buyer agent negotiating for the best price.`;

    return this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a buyer agent negotiating for the best price.' },
        { role: 'user', content: prompt }
      ]
    });
  }
} 