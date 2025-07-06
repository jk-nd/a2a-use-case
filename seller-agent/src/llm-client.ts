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

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  category: string;
  features: string[];
}

export class LLMClient {
  private openai: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private products: Product[];

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
    
    // Initialize with sample products
    this.products = [
      {
        id: 'laptop-premium',
        name: 'Premium Laptop',
        description: 'High-performance laptop with 16GB RAM, 512GB SSD, Intel i7 processor',
        basePrice: 1200,
        minPrice: 1000,
        maxPrice: 1400,
        category: 'electronics',
        features: ['16GB RAM', '512GB SSD', 'Intel i7', '15.6" Display']
      },
      {
        id: 'laptop-standard',
        name: 'Standard Laptop',
        description: 'Reliable laptop with 8GB RAM, 256GB SSD, Intel i5 processor',
        basePrice: 800,
        minPrice: 650,
        maxPrice: 950,
        category: 'electronics',
        features: ['8GB RAM', '256GB SSD', 'Intel i5', '14" Display']
      },
      {
        id: 'monitor-4k',
        name: '4K Monitor',
        description: 'Ultra-high definition 27" 4K monitor with HDR support',
        basePrice: 400,
        minPrice: 320,
        maxPrice: 480,
        category: 'electronics',
        features: ['27" Display', '4K Resolution', 'HDR Support', 'USB-C']
      }
    ];
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
    return 'I\'m a seller agent with quality products. How can I help you today?';
  }

  // Specific methods for seller agent
  async selectProductForCustomer(customerRequest: string): Promise<{
    product: Product;
    reasoning: string;
  }> {
    const prompt = `Customer request: "${customerRequest}"
    
    Available products:
    ${this.products.map(p => `- ${p.name}: $${p.basePrice} (${p.description})`).join('\n')}
    
    Select the best product for this customer and explain why.`;

    const response = await this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a seller agent helping customers find the right product. Be helpful and professional.' },
        { role: 'user', content: prompt }
      ]
    });

    // Select a product based on the response
    const selectedProduct = this.products[0]; // For simplicity, always select first product
    
    return {
      product: selectedProduct,
      reasoning: response
    };
  }

  async negotiatePrice(customerOffer: number, product: Product): Promise<{
    decision: 'accept' | 'counter' | 'reject';
    reasoning: string;
    counterOffer?: number;
  }> {
    const prompt = `Customer offers $${customerOffer} for ${product.name}
    Product base price: $${product.basePrice}
    Min price: $${product.minPrice}
    Max price: $${product.maxPrice}
    
    Decide whether to accept, counter-offer, or reject. Be strategic but fair.`;

    const response = await this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a seller agent negotiating prices. Be professional and strategic.' },
        { role: 'user', content: prompt }
      ]
    });

    if (customerOffer >= product.minPrice) {
      return { decision: 'accept', reasoning: response };
    } else {
      const counterOffer = Math.floor((product.minPrice + product.basePrice) / 2);
      return { decision: 'counter', reasoning: response, counterOffer };
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }
} 