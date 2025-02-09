import { ActionProvider, CreateAction } from "@coinbase/agentkit";
import { Network } from "@coinbase/agentkit/dist/network";
import { ethers } from 'ethers';
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import {
  TransactionConfig,
  TransactionRisk,
  UserSession,
  UserProgress,
  XPEvent,
  TransactionAnalysis,
  BasescanContractResponse,
  BasescanResponse,
  BasescanTxResponse,
  Achievement
} from '../types/transaction';
import {
  MonitorAddressSchema,
  AnalyzeTransactionSchema,
  UpdateUserProgressSchema,
  StopMonitoringSchema
} from "../schemas/transaction";
import { z } from "zod";

export class TransactionAnalysisProvider extends ActionProvider {
  private lastKnownTx: Record<string, string>;
  private readonly basescanApiKey: string;
  private readonly provider: ethers.JsonRpcProvider;
  private readonly supportedNetworks: Network[];
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private llm?: ChatOpenAI;
  private userSessions: Map<string, UserSession>;

  private logger = {
    info: (message: string, ...args: any[]) => {
      console.log(`[TransactionAnalysisProvider] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[TransactionAnalysisProvider] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      console.debug(`[TransactionAnalysisProvider] ${message}`, ...args);
    }
  };
  
  // XP System Configuration
  private readonly XP_ACTIONS: Record<string, XPEvent> = {
    TRANSACTION_ANALYZED: { action: 'Transaction Analysis', baseXP: 10, multiplier: 1, description: 'Analyzed a transaction' },
    SAFE_TRANSACTION: { action: 'Safe Transaction', baseXP: 20, multiplier: 1.2, description: 'Completed a safe transaction' },
    COMPLEX_INTERACTION: { action: 'Complex Interaction', baseXP: 30, multiplier: 1.5, description: 'Handled complex contract interaction' },
    FIRST_DEFI: { action: 'DeFi Pioneer', baseXP: 50, multiplier: 2, description: 'First DeFi interaction' },
    ACHIEVEMENT_UNLOCKED: { action: 'Achievement', baseXP: 100, multiplier: 1, description: 'Unlocked new achievement' },
  };

  constructor(config: TransactionConfig) {
    super("enhanced_transaction_analysis", []);

    console.log('[TransactionAnalysisProvider] Provider instantiated with config:', {
      basescanApiKey: !!config.basescanApiKey,
      rpcUrl: config.rpcUrl,
      supportedNetworks: config.supportedNetworks
    });

    this.lastKnownTx = {};
    this.basescanApiKey = config.basescanApiKey;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.supportedNetworks = config.supportedNetworks || [{
      protocolFamily: 'base',
      networkId: 'base-mainnet',
      chainId: '8453'
    }];
    this.apiUrl = config.apiUrl || 'http://localhost:3000';
    this.apiKey = config.apiKey || '';
    this.userSessions = new Map();
    this.cleanupInactiveSessions();
  }

  public setLLM(llm: ChatOpenAI) {
    this.llm = llm;
  }

  public supportsNetwork(network: Network): boolean {
    return this.supportedNetworks.some(supported => 
      supported.protocolFamily === network.protocolFamily &&
      supported.networkId === network.networkId &&
      supported.chainId === network.chainId
    );
  }

  @CreateAction({
    name: "monitor_address",
    description: "Monitors an address for new transactions and provides real-time analysis",
    schema: MonitorAddressSchema as any
  } as const)
  public async monitorAddress(args: z.infer<typeof MonitorAddressSchema>): Promise<string> {
    const { userAddress, currentLevel } = args;

    try {
      this.logger.info('Starting monitor_address action', { userAddress, currentLevel });

      const existingSession = this.userSessions.get(userAddress);
      if (existingSession?.isActive) {
        this.logger.info('Address already being monitored', { userAddress });
        return `Already monitoring address ${userAddress}`;
      }

      this.logger.info('Setting up new monitoring session', { userAddress });
      const lastCheckedBlock = await this.provider.getBlockNumber();
      
      const intervalId = setInterval(async () => {
        this.logger.debug('Running periodic transaction check', { userAddress });
        await this.checkNewTransactions(userAddress, currentLevel);
      }, 30000);

      this.userSessions.set(userAddress, {
        intervalId,
        lastCheckedBlock,
        isActive: true,
        lastUpdate: Date.now(),
        pendingTransactions: new Set()
      });
      
      this.logger.info('Successfully started monitoring', { userAddress });
      return `Started monitoring address ${userAddress}`;
    } catch (error) {
      return `Error monitoring address: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: "analyze_transaction",
    description: "Analyzes a specific transaction with user-level-appropriate explanations",
    schema: AnalyzeTransactionSchema as any
  })
  public async analyzeTransaction(args: z.infer<typeof AnalyzeTransactionSchema>): Promise<string> {
    const { txHash, userLevel, isNewTransaction } = args;

    try {
      const analysis = await this.performTransactionAnalysis(txHash, userLevel);
      
      // Save to database
      await this.saveAnalysisToDatabase(txHash, userLevel, analysis);
      
      return `
        ${isNewTransaction ? '🆕 New Transaction Detected!' : 'Transaction Analysis:'}
        
        ${analysis.explanation}
        
        ${this.formatRiskAlert(analysis.riskAnalysis)}
      `;
    } catch (error) {
      return `Error analyzing transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @CreateAction({
    name: "update_user_progress",
    description: "Updates user XP and level based on their actions",
    schema: UpdateUserProgressSchema as any
  })
  public async updateUserProgress(args: z.infer<typeof UpdateUserProgressSchema>): Promise<UserProgress> {
    const { userAddress, action, context } = args;
    const userProgress = await this.getUserProgress(userAddress);
    
    const xpGained = this.calculateXPGain(action, context);
    userProgress.xp += xpGained;
    userProgress.transactionsAnalyzed += 1;
    
    const newLevel = this.calculateLevel(userProgress.xp);
    userProgress.level = newLevel;

    const newAchievements = await this.checkAchievements(userProgress, context);
    userProgress.achievements.push(...newAchievements);

    await this.saveUserProgress(userProgress);
    return userProgress;
  }

  private async checkAchievements(progress: UserProgress, context?: any): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    // First transaction analysis
    if (progress.transactionsAnalyzed === 1) {
      newAchievements.push({
        id: 'FIRST_ANALYSIS',
        name: 'First Steps',
        description: 'Analyzed your first transaction',
        xpReward: 100,
        dateUnlocked: Date.now()
      });
    }

    // Transaction milestone achievements
    if (progress.transactionsAnalyzed === 10) {
      newAchievements.push({
        id: 'TRANSACTION_EXPLORER',
        name: 'Transaction Explorer',
        description: 'Analyzed 10 transactions',
        xpReward: 250,
        dateUnlocked: Date.now()
      });
    }

    if (progress.transactionsAnalyzed === 100) {
      newAchievements.push({
        id: 'BLOCKCHAIN_DETECTIVE',
        name: 'Blockchain Detective',
        description: 'Analyzed 100 transactions',
        xpReward: 1000,
        dateUnlocked: Date.now()
      });
    }

    // Level-based achievements
    if (progress.level === 10) {
      newAchievements.push({
        id: 'RISING_ANALYST',
        name: 'Rising Analyst',
        description: 'Reached level 10',
        xpReward: 500,
        dateUnlocked: Date.now()
      });
    }

    if (progress.level === 50) {
      newAchievements.push({
        id: 'EXPERT_ANALYST',
        name: 'Expert Analyst',
        description: 'Reached level 50',
        xpReward: 2000,
        dateUnlocked: Date.now()
      });
    }

    // Transaction type achievements
    if (context?.complexTransaction) {
      newAchievements.push({
        id: 'COMPLEXITY_MASTER',
        name: 'Complexity Master',
        description: 'Analyzed a complex smart contract interaction',
        xpReward: 300,
        dateUnlocked: Date.now()
      });
    }

    if (context?.highValueTransaction) {
      newAchievements.push({
        id: 'WHALE_WATCHER',
        name: 'Whale Watcher',
        description: 'Analyzed a high-value transaction (>1 ETH)',
        xpReward: 400,
        dateUnlocked: Date.now()
      });
    }

    // Risk analysis achievements
    if (context?.riskLevel === 'danger' && progress.level >= 30) {
      newAchievements.push({
        id: 'RISK_DETECTOR',
        name: 'Risk Detector',
        description: 'Successfully identified a high-risk transaction',
        xpReward: 350,
        dateUnlocked: Date.now()
      });
    }

    // Special achievements
    if (context?.consecutiveDays >= 7) {
      newAchievements.push({
        id: 'DEDICATED_ANALYST',
        name: 'Dedicated Analyst',
        description: 'Analyzed transactions for 7 consecutive days',
        xpReward: 700,
        dateUnlocked: Date.now()
      });
    }

    if (context?.uniqueContracts >= 10) {
      newAchievements.push({
        id: 'CONTRACT_CONNOISSEUR',
        name: 'Contract Connoisseur',
        description: 'Analyzed transactions involving 10 different smart contracts',
        xpReward: 600,
        dateUnlocked: Date.now()
      });
    }

    if (context?.defiInteraction) {
      newAchievements.push({
        id: 'DEFI_EXPLORER',
        name: 'DeFi Explorer',
        description: 'Analyzed your first DeFi protocol interaction',
        xpReward: 450,
        dateUnlocked: Date.now()
      });
    }

    return newAchievements;
  }

  private async saveUserProgress(progress: UserProgress): Promise<void> {
    await fetch(`${this.apiUrl}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(progress)
    });
  }

  private async getUserProgress(address: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/progress/${address}`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });
    
    return response.json();
  }

  @CreateAction({
    name: "stop_monitoring",
    description: "Stops monitoring an address",
    schema: StopMonitoringSchema as any
  })
  public async stopMonitoring(args: z.infer<typeof StopMonitoringSchema>): Promise<string> {
    const { userAddress } = args;
    
    const session = this.userSessions.get(userAddress);
    if (session?.isActive) {
      clearInterval(session.intervalId);
      session.isActive = false;
      this.userSessions.set(userAddress, session);
      return `Stopped monitoring address ${userAddress}`;
    }
    
    return `Not monitoring address ${userAddress}`;
  }

  private async checkNewTransactions(userAddress: string, currentLevel: number): Promise<void> {
    try {
      console.log('new check')

      const session = this.userSessions.get(userAddress);
      if (!session || !session.isActive) return;

      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock > session.lastCheckedBlock) {
        const txs = await this.getTransactionsSince(userAddress, session.lastCheckedBlock);
        
        for (const tx of txs) {
          if (!tx || session.pendingTransactions.has(tx.hash)) continue;
          
          session.pendingTransactions.add(tx.hash);
          
          this.processTransaction(tx, userAddress, currentLevel)
            .finally(() => {
              session.pendingTransactions.delete(tx.hash);
            });
        }
        
        session.lastCheckedBlock = currentBlock;
        session.lastUpdate = Date.now();
        this.userSessions.set(userAddress, session);
      }
    } catch (error) {
      console.error('Error checking new transactions:', error);
    }
  }

  private async processTransaction(
    tx: ethers.TransactionResponse,
    userAddress: string,
    currentLevel: number
  ): Promise<void> {
    try {
      const analysis = await this.performTransactionAnalysis(tx.hash, currentLevel);
      
      await this.saveAnalysisToDatabase(tx.hash, currentLevel, analysis);
      
      await this.updateUserProgress({
        userAddress,
        action: 'TRANSACTION_ANALYZED',
        context: {
          transactionHash: tx.hash,
          complexity: analysis.complexity
        }
      });
    } catch (error) {
      console.error(`Error processing transaction ${tx.hash}:`, error);
    }
  }

  private async performTransactionAnalysis(
    txHash: string,
    userLevel: number
  ): Promise<TransactionAnalysis> {
    const tx = await this.provider.getTransaction(txHash);
    if (!tx) throw new Error('Transaction not found');

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) throw new Error('Transaction receipt not found');

    const [riskAnalysis, explanation] = await Promise.all([
      this.assessTransactionRisk(tx, receipt),
      this.generateLevelAppropriateExplanation(tx, receipt, userLevel)
    ]);

    const complexity = await this.calculateTransactionComplexity(txHash);
    const type = this.determineTransactionType(tx);

    return {
      explanation,
      riskAnalysis,
      complexity,
      type
    };
  }

  private async getTransactionsSince(address: string, fromBlock: number): Promise<ethers.TransactionResponse[]> {
    const currentBlock = await this.provider.getBlockNumber();
    
    try {
      const baseUrl = "https://api.basescan.org/api";
      const response = await fetch(
        `${baseUrl}?module=account&action=txlist&address=${address}&startblock=${fromBlock}&endblock=${currentBlock}&sort=asc&apikey=${this.basescanApiKey}`
      );
      
      const data = (await response.json()) as BasescanTxResponse;
      if (data.status === "1" && data.result.length > 0) {
        const txs = await Promise.all(
          data.result.map((tx: any) => this.provider.getTransaction(tx.hash))
        );
        return txs.filter((tx): tx is ethers.TransactionResponse => tx !== null);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  private async assessTransactionRisk(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt
  ): Promise<TransactionRisk> {
    try {
      const valueInEth = Number(ethers.formatEther(tx.value));
      const gasUsed = receipt.gasUsed;
      const gasLimit = tx.gasLimit;
  
      const riskFactors = {
        highValue: valueInEth > 1,
        unusualGas: gasUsed > (gasLimit * BigInt(8)) / BigInt(10),
        newContract: tx.to ? !(await this.isVerifiedContract(tx.to)) : true,
        failedTx: receipt.status === 0,
        complexData: tx.data && tx.data.length > 138,
        highGasPrice: tx.gasPrice > ethers.parseUnits("100", "gwei")
      };
  
      return this.evaluateRiskFactors(riskFactors);
    } catch (error) {
      console.error('Error in risk assessment:', error);
      return {
        riskLevel: 'warning',
        reason: '⚠️ Unable to perform complete risk analysis',
        recommendation: 'Proceed with caution and verify all parameters.'
      };
    }
  }

  private evaluateRiskFactors(riskFactors: any): TransactionRisk {
    if (riskFactors.failedTx) {
      return {
        riskLevel: 'warning',
        reason: '⚠️ Transaction failed',
        recommendation: 'Check transaction parameters and account balance before retrying.'
      };
    }

    if (riskFactors.highValue && riskFactors.newContract) {
      return {
        riskLevel: 'danger',
        reason: '🚨 High value transaction with unverified contract',
        recommendation: 'Carefully verify the contract and its audits before proceeding. Consider testing with a smaller amount first.'
      };
    }

    if (riskFactors.unusualGas && riskFactors.complexData) {
      return {
        riskLevel: 'warning',
        reason: '⚠️ Complex transaction with high gas usage',
        recommendation: 'Make sure you understand all actions this transaction will perform.'
      };
    }

    if (riskFactors.highGasPrice) {
      return {
        riskLevel: 'warning',
        reason: '⚠️ Unusually high gas price',
        recommendation: 'Consider waiting for gas prices to decrease before making this transaction.'
      };
    }

    return {
      riskLevel: 'safe',
      reason: '✅ Standard transaction with no particular risks detected',
      recommendation: 'You can proceed with confidence.'
    };
  }

  private async generateLevelAppropriateExplanation(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    userLevel: number,
  ): Promise<string> {
    try {
      if (!this.llm) {
        throw new Error("LLM not initialized");
      }

      const txData = this.prepareTxDataForAnalysis(tx, receipt);
      const prompt = this.createAnalysisPrompt(txData, userLevel);
      
      const messages = [
        new SystemMessage(prompt),
        new HumanMessage("Analyze this transaction.")
      ];

      const response = await this.llm.invoke(messages);
      return this.formatLLMResponse(response);
    } catch (error) {
      console.error('Error generating explanation:', error);
      return `Error analyzing transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private prepareTxDataForAnalysis(
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt
  ): any {
    return {
      value: ethers.formatEther(tx.value),
      gasCost: ethers.formatEther(tx.gasPrice * receipt.gasUsed),
      status: receipt.status,
      to: tx.to,
      from: tx.from,
      hash: tx.hash,
      input: tx.data,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.logs,
      type: this.determineTransactionType(tx),
      blockNumber: tx.blockNumber,
      gasPrice: tx.gasPrice.toString(),
      methodId: tx.data.slice(0, 10),
      nonce: tx.nonce,
      success: receipt.status === 1,
      eventCount: receipt.logs.length
    };
  }

  private createAnalysisPrompt(txData: any, userLevel: number): string {
    return `You are analyzing a single specific Ethereum transaction.
    Focus ONLY on these transaction details:
    ${JSON.stringify(txData, null, 2)}

    User knowledge level: ${userLevel}/100

    PROVIDE:
    1. A single ${userLevel < 30 ? 'simple' : userLevel < 70 ? 'technical' : 'expert'} explanation
    2. ONLY describe what THIS SPECIFIC transaction does
    3. Base your analysis on the actual data provided above
    4. Max 3 sentences

    DO NOT:
    - Ask for more information
    - Give generic responses
    - Talk about risks or recommendations
    - Add greetings or default responses

    IMPORTANT: Use the real transaction data to explain what happened.`;
  }

  private formatLLMResponse(response: any): string {
    if (typeof response.content === 'string') {
      return response.content;
    }
    if (Array.isArray(response.content)) {
      return response.content
        .map((item: unknown) => typeof item === 'string' ? item : JSON.stringify(item))
        .join(' ');
    }
    return JSON.stringify(response.content);
  }

  private async isVerifiedContract(address: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${this.basescanApiKey}`
      );
      const data = (await response.json()) as BasescanContractResponse;
      return data.status === '1' && data.result !== 'Contract source code not verified';
    } catch {
      return false;
    }
  }

  private determineTransactionType(tx: ethers.TransactionResponse): string {
    if (!tx.data || tx.data === '0x') return 'ETH Transfer';
    if (tx.data.startsWith('0xa9059cbb')) return 'ERC20 Transfer';
    if (tx.data.startsWith('0x23b872dd')) return 'ERC20 TransferFrom';
    return 'Contract Interaction';
  }

  private async calculateTransactionComplexity(txHash: string): Promise<number> {
    const tx = await this.provider.getTransaction(txHash);
    let complexity = 0;
    
    if (tx) {
      complexity += tx.data && tx.data !== '0x' ? 2 : 0;
      complexity += tx.value > ethers.parseEther('1') ? 2 : 1;
      complexity += tx.gasLimit > ethers.parseUnits('100000', 'wei') ? 2 : 1;
    }

    return complexity;
  }

  private calculateXPGain(action: string, context?: any): number {
    const xpEvent = this.XP_ACTIONS[action];
    if (!xpEvent) return 0;

    let multiplier = xpEvent.multiplier;
    if (context?.complexity) {
      multiplier *= (1 + context.complexity / 10);
    }

    return Math.floor(xpEvent.baseXP * multiplier);
  }

  private calculateLevel(xp: number): number {
    let level = 1;
    while (level < 100) {
      const requiredXP = Math.floor(100 * Math.pow(1.5, level - 1));
      if (xp < requiredXP) break;
      level++;
    }
    return level;
  }

  private async saveAnalysisToDatabase(
    txHash: string, 
    userLevel: number, 
    analysis: TransactionAnalysis
  ): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          transactionHash: txHash,
          userLevel,
          ...analysis
        })
      });
    } catch (error) {
      console.error('Error saving analysis to database:', error);
    }
  }

  private cleanupInactiveSessions(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [address, session] of this.userSessions) {
        if (!session.isActive && (now - session.lastUpdate > 3600000)) {
          this.userSessions.delete(address);
        }
      }
    }, 3600000); // Nettoyage toutes les heures
  }

  private formatRiskAlert(risk: TransactionRisk): string {
    return `
      Risk Assessment:
      Level: ${risk.riskLevel.toUpperCase()}
      ${risk.reason}
      
      Recommendation: ${risk.recommendation}
    `;
  }

}

export const createTransactionAnalysisProvider = (config: Partial<TransactionConfig> = {}) => {
  const defaultConfig: TransactionConfig = {
    basescanApiKey: process.env.BASESCAN_API_KEY || '',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    apiUrl: process.env.BACKEND_API_URL,
    apiKey: process.env.BACKEND_API_KEY,
    supportedNetworks: [{
      protocolFamily: 'base',
      networkId: 'base-mainnet',
      chainId: '8453'
    }]
  };

  return new TransactionAnalysisProvider({
    ...defaultConfig,
    ...config
  });
};