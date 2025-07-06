import OpenAI from 'openai';

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
  private openai: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '1000');
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');
  }

  async generateResponse(request: LLMRequest): Promise<string> {
    try {
      console.log('🤖 Making OpenAI API call...');
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: request.messages,
        max_tokens: request.max_tokens || this.maxTokens,
        temperature: request.temperature || this.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log('✅ OpenAI response received');
      return content;
    } catch (error) {
      console.error('❌ OpenAI API call failed:', error);
      return this.getFallbackResponse(request);
    }
  }

  private getFallbackResponse(request: LLMRequest): string {
    console.log('⚠️ Using fallback response due to API failure');
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
        { role: 'system', content: 'You are a buyer agent focused on getting the best value for money. Respond concisely and clearly.' },
        { role: 'user', content: prompt }
      ]
    });

    // Parse the response to extract decision
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('accept')) {
      return { decision: 'accept', reasoning: response };
    } else if (lowerResponse.includes('negotiate')) {
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
    
    Respond as a buyer agent negotiating for the best price. Keep your response concise and professional.`;

    return this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a buyer agent negotiating for the best price. Be professional and strategic.' },
        { role: 'user', content: prompt }
      ]
    });
  }
} 