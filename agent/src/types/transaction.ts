import { Network } from "@coinbase/agentkit/dist/network";

export interface TransactionRisk {
  riskLevel: 'safe' | 'warning' | 'danger';
  reason: string;
  recommendation: string;
}

export interface TransactionConfig {
  basescanApiKey: string;
  rpcUrl: string;
  supportedNetworks?: Network[];
  apiUrl?: string;
  apiKey?: string;
}

export interface UserSession {
  intervalId: NodeJS.Timeout;
  lastCheckedBlock: number;
  isActive: boolean;
  lastUpdate: number;
  pendingTransactions: Set<string>;
}

export interface UserProgress {
  address: string;
  xp: number;
  level: number;
  transactionsAnalyzed: number;
  lastUpdate: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  dateUnlocked: number;
}

export interface XPEvent {
  action: string;
  baseXP: number;
  multiplier: number;
  description: string;
}

export interface TransactionAnalysis {
  explanation: string;
  riskAnalysis: TransactionRisk;
  complexity: number;
  type: string;
}

export interface RiskFactors {
  highValue: boolean;
  unusualGas: boolean;
  newContract: boolean;
  failedTx: boolean;
  complexData: boolean;
  highGasPrice: boolean;
}