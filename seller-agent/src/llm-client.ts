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
  private apiKey: string;
  private baseUrl: string;
  private products: Product[];

  constructor() {
    this.apiKey = process.env.LLM_API_KEY || 'mock-key';
    this.baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    
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
      return this.simulateLLMResponse(request);
    } catch (error) {
      console.error('LLM request failed:', error);
      return this.getFallbackResponse(request);
    }
  }

  private simulateLLMResponse(request: LLMRequest): string {
    const lastMessage = request.messages[request.messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    // Simulate seller agent behavior
    if (content.includes('product') || content.includes('available') || content.includes('have')) {
      return this.generateProductOffer();
    }

    if (content.includes('price') || content.includes('cost') || content.includes('offer')) {
      if (content.includes('$')) {
        const priceMatch = content.match(/\$(\d+)/);
        if (priceMatch) {
          const offeredPrice = parseInt(priceMatch[1]);
          return this.generatePriceResponse(offeredPrice);
        }
      }
      return 'I can offer competitive pricing. What\'s your budget range?';
    }

    if (content.includes('negotiate') || content.includes('discount')) {
      return 'I\'m willing to work with you on pricing. What\'s your target price?';
    }

    if (content.includes('agree') || content.includes('accept')) {
      return 'Excellent! I accept your offer. Let\'s proceed with the payment workflow.';
    }

    return 'I\'m a seller agent with quality products. What are you looking for?';
  }

  private generateProductOffer(): string {
    const product = this.products[Math.floor(Math.random() * this.products.length)];
    return `I have a ${product.name} available for $${product.basePrice}. ${product.description}. Features include: ${product.features.join(', ')}. Would you like to know more about this product?`;
  }

  private generatePriceResponse(offeredPrice: number): string {
    const product = this.products[0]; // Use first product for simplicity
    
    if (offeredPrice >= product.minPrice && offeredPrice <= product.maxPrice) {
      return `I can work with $${offeredPrice}. That\'s a fair offer for the ${product.name}. Let\'s proceed!`;
    } else if (offeredPrice < product.minPrice) {
      const counterOffer = Math.floor((product.minPrice + product.basePrice) / 2);
      return `I appreciate your offer of $${offeredPrice}, but I need at least $${counterOffer} for the ${product.name}. This is still a great value!`;
    } else {
      return `$${offeredPrice} is very generous! I accept your offer for the ${product.name}.`;
    }
  }

  private getFallbackResponse(request: LLMRequest): string {
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
        { role: 'system', content: 'You are a seller agent helping customers find the right product.' },
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
    
    Decide whether to accept, counter-offer, or reject.`;

    const response = await this.generateResponse({
      messages: [
        { role: 'system', content: 'You are a seller agent negotiating prices.' },
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