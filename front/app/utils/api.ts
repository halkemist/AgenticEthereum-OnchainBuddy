
export class AgentAPI {
   async monitoring(address: string): Promise {
    const response = await fetch('http://localhost:5000/api/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    return response.json();
  };
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