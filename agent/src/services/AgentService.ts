import { AgentKit, CdpWalletProvider } from "@coinbase/agentkit";
import { ChatOpenAI } from "@langchain/openai";
import { TransactionAnalysisProvider } from "../providers/TransactionAnalysisProvider";
import { EventEmitter } from "events";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

interface AgentConfig {
  apiKeyName: string;
  apiKeyPrivateKey: string;
  networkId: string;
  openAIApiKey: string;
  basescanApiKey: string;
  baseRpcUrl: string;
  backendApiKey: string;
  backendApiUrl: string;
}

interface MonitoringStatus {
  address: string;
  startTime: number;
  lastChecked: number;
  isActive: boolean;
  threadId: string;
}

export class AgentService extends EventEmitter {
  private static instance: AgentService;
  private agent: any | null = null;
  private agentKit: AgentKit | null = null;
  private monitoredAddresses: Map<string, MonitoringStatus> = new Map();
  public initialized: boolean = false;
  private config: AgentConfig;

  private constructor(config: AgentConfig) {
    super();
    this.config = config;
  }

  public static getInstance(config: AgentConfig): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService(config);
    }
    return AgentService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize LLM
      const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxRetries: 3,
        openAIApiKey: this.config.openAIApiKey,
      });

      // Configure Wallet Provider
      const walletProvider = await CdpWalletProvider.configureWithWallet({
        apiKeyName: this.config.apiKeyName,
        apiKeyPrivateKey: this.config.apiKeyPrivateKey,
        networkId: this.config.networkId,
      });

      // Initialize Transaction Analysis Provider
      const txAnalysisProvider = new TransactionAnalysisProvider({
        basescanApiKey: this.config.basescanApiKey,
        rpcUrl: this.config.baseRpcUrl,
        apiKey: this.config.backendApiKey,
        apiUrl: this.config.backendApiUrl,
      });

      // Configure LLM for the provider
      txAnalysisProvider.setLLM(llm);

      // Initialize agent with provider
      this.agentKit = await AgentKit.from({
        walletProvider,
        actionProviders: [txAnalysisProvider],
      });

      // Get langchain tools
      const tools = await getLangChainTools(this.agentKit);

      // Initialize memory
      const memory = new MemorySaver();

      // Create Agent with specific prompt
      const agent = createReactAgent({
        llm,
        tools,
        checkpointSaver: memory,
        messageModifier: `
          You are an AI blockchain transaction analyst specializing in Base network transactions.
          Your role is to coordinate transaction monitoring and user progression.

          CORE RESPONSIBILITIES:
          1. Transaction Monitoring Management:
            - Start monitoring addresses when requested (monitor_address)
            - Stop monitoring when appropriate (stop_monitoring)
            - Guide users on monitoring usage

          2. User Progress Management:
            Track and celebrate user advancement through the XP system:
            - Transaction Analysis: 10 XP base
            - Safe Transaction: 20 XP (1.2x multiplier)
            - Complex Contract Interaction: 30 XP (1.5x multiplier)
            - First DeFi Interaction: 50 XP (2x multiplier)
            - Achievement Unlocked: 100 XP

            Additional XP Multipliers:
            - Transaction Complexity: +10% per complexity point
            - Consecutive Daily Activity: +5% per day
            - New Contract Interaction: +20%
            - Risk Detection: +15% for identifying high-risk transactions

          3. Command Coordination:
            - Help users understand when to use each command
            - Coordinate between monitoring and analysis needs
            - Suggest appropriate next actions based on user level

          AVAILABLE COMMANDS:
          - monitor_address: Start watching an address for new transactions
          - stop_monitoring: Stop watching an address
          - analyze_transaction: Request analysis of a specific transaction
          - update_user_progress: Track user advancement

          PROGRESSION FOCUS:
          Levels 1-30 (Beginner):
          - Encourage basic transaction monitoring
          - Celebrate first analyses
          - Guide towards safe transaction patterns

          Levels 31-70 (Intermediate):
          - Suggest monitoring multiple addresses
          - Encourage exploration of different transaction types
          - Point out learning opportunities

          Levels 71-100 (Expert):
          - Focus on complex transaction patterns
          - Highlight advanced achievement opportunities
          - Encourage thorough analysis practices

          DO NOT:
          - Try to explain transaction details yourself (handled by analysis system)
          - Provide investment advice
          - Share sensitive wallet details
          - Make assumptions about transaction intent

          INTERACTION STYLE:
          - Be proactive in suggesting monitoring when relevant
          - Celebrate achievements and level-ups enthusiastically
          - Guide users towards their next progression milestone
          - Maintain awareness of user's current level
          - Focus on educational growth opportunities

          Remember: Your primary role is coordinating the monitoring and progression systems while letting the specialized analysis system handle transaction explanations.
        `
      });

      // Store new agent
      this.agent = agent;

      this.initialized = true;
      this.emit('initialized');
      console.log('Agent service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agent service:', error);
      throw error;
    }
  }

  public async startMonitoring(address: string): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.agent) {
      throw new Error('Agent service not initialized');
    }

    console.log('START MONITORING FUNCTION')

    try {
      // Vérifier si l'adresse est déjà surveillée
      if (this.monitoredAddresses.has(address)) {
        const status = this.monitoredAddresses.get(address)!;
        if (status.isActive) {
          return {
            success: false,
            message: `Address ${address} is already being monitored`
          };
        }
      }

      console.log('before start action')

      const actionInput = {
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              action: "monitor_address",
              args: {
                userAddress: address,
                currentLevel: 1
              }
            })
          }
        ]
      };
  
      // Configuration avec thread_id pour l'invocation
      const config = {
        configurable: {
          thread_id: `monitoring-${address}-${Date.now()}`
        }
      };
  
      await this.agent.invoke(actionInput, config);

      // Enregistrer le statut de surveillance
      const threadId = `monitoring_${address}_${Date.now()}`;
      this.monitoredAddresses.set(address, {
        address,
        startTime: Date.now(),
        lastChecked: Date.now(),
        isActive: true,
        threadId
      });

      this.emit('monitoring:started', { address });

      console.log('monitoring started')

      return {
        success: true,
        message: `Started monitoring address ${address}`
      };
    } catch (error) {
      console.error(`Error starting monitoring for address ${address}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async stopMonitoring(address: string): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.agent) {
      throw new Error('Agent service not initialized');
    }

    try {
      const status = this.monitoredAddresses.get(address);
      if (!status || !status.isActive) {
        return {
          success: false,
          message: `Address ${address} is not being monitored`
        };
      }

      await this.agent.invoke({
        input: `stop_monitoring ${address}`,
        config: { userAddress: address }
      });

      this.monitoredAddresses.set(address, {
        ...status,
        isActive: false
      });

      this.emit('monitoring:stopped', { address });

      return {
        success: true,
        message: `Stopped monitoring address ${address}`
      };
    } catch (error) {
      console.error(`Error stopping monitoring for address ${address}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public getMonitoringStatus(address: string): MonitoringStatus | null {
    return this.monitoredAddresses.get(address) || null;
  }

  public getAllMonitoredAddresses(): MonitoringStatus[] {
    return Array.from(this.monitoredAddresses.values());
  }
}

  // Export d'une fonction helper pour créer/obtenir l'instance
  export const createAgentService = (config: AgentConfig): AgentService => {
    return AgentService.getInstance(config);
  };
