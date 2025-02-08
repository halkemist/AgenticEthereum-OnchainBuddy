import { AgentKit, CdpWalletProvider } from "@coinbase/agentkit";
import { ChatOpenAI } from "@langchain/openai";
import { TransactotionAnalysisProvider } from "../providers/TransactionAnalysisProvider";
import { EventEmitter } from "stream";

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
}

export class AgentService extends EventEmitter {
  private static instance: AgentService;
  private agent: AgentKit | null = null;
  private monitoredAddresses: Map<string, MonitoringStatus> = new Map();
  private initialized: boolean = false;
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
      const txAnalysisProvider = new TransactotionAnalysisProvider({
        basescanApiKey: this.config.basescanApiKey,
        rpcUrl: this.config.baseRpcUrl,
        apiKey: this.config.backendApiKey,
        apiUrl: this.config.backendApiUrl,
      });

      // Configure LLM for the provider
      txAnalysisProvider.setLLM(llm);

      // Initialize agent with provider
      this.agent = await AgentKit.from({
        walletProvider,
        actionProviders: [txAnalysisProvider],
      });

      this.initialized = true;
      this.emit('initialized');
      console.log('Agent service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agent service:', error);
      throw error;
    }
  }

}