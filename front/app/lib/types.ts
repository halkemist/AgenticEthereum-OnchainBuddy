interface TransactionAnalysis {
  explanation: string;
  xpEarned: number;
  levelUp?: boolean;
  achievements?: string[];
}

interface AgentResponse {
  type: 'transaction' | 'progress' | 'achievement';
  data: TransactionAnalysis | UserProgress;
  message?: string;
}

interface Transaction {
  id: string;
  type: string;
  timestamp: number;
  description: string;
  aiExplanation: string;
  amount?: string;
  token?: string;
  platform?: string;
}

interface UserProgress {
  level: number;
  xp: number;
  maxXp: number;
}

interface Notification {
  id: string;
  message: string;
  type: 'achievement' | 'levelUp';
}

interface Stats {
  totalTransactions: number;
  uniqueContracts: number;
  defiInteractions: number;
  riskLevel: 'safe' | 'warning' | 'danger';
}

export type { TransactionAnalysis, AgentResponse, Transaction, UserProgress, Notification, Stats };