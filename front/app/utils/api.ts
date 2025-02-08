import { initializeAgent } from './../lib/agentkit/typescript/examples/langchain-cdp-chatbot/chatbot';

export class BlockchainEducatorAgent {
  private agent: any;
  private config: any;

  constructor() {}

  async initialize() {
    const { agent, config: agentConfig } = await initializeAgent();
    this.agent = agent;
    this.config = agentConfig;
  }

  async monitorAddress(address: string) {
    const response = await fetch(`${this.baseUrl}/api/monitor`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_BACKEND_API_KEY 
      },
      body: JSON.stringify({ address })
    });
    return response.json();
  }
}

export class BackendAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'http://localhost:3000') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getUserProgress(address: string): Promise<{
    address: string;
    xp: number;
    level: number;
    transactionsAnalyzed: number;
    lastUpdate: number;
    achievements: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/progress/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      
      return {
        address,
        xp: 0,
        level: 1,
        transactionsAnalyzed: 0,
        lastUpdate: Date.now(),
        achievements: []
      };
    }
  }
}