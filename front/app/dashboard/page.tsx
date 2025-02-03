'use client';

import { useState } from 'react';
import { SmartToy as BotIcon } from '@mui/icons-material';

// Types
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

const Dashboard: React.FC = () => {

  // State
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    xp: 250,
    maxXp: 1000
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'Token Swap',
      timestamp: Date.now() - 7200000, // 720000ms = 2 hours ago
      description: 'You swapped 0.1 ETH for 100 USDC on Uniswap',
      aiExplanation: 'This was a basic swap transaction with a 0.3% fee. The price impact was minimal.',
      amount: '0.1',
      token: 'ETH',
      platform: 'Uniswap'
    }
  ]);

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* AI Assistant Chat Bubble */}
      <div className="max-w-2xl mx-auto mb-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 rounded-full p-2">
            <BotIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-800">
                Hello! I'm your Onchain Buddy. I'll help you understand your blockchain activities.
                Let me analyze your recent transactions...
              </p>
            </div>
            {/* Progress indicator */}
            <div className="mt-2 flex items-center space-x-2">
              <div className="text-sm text-gray-500">Level {userProgress.level}</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(userProgress.xp / userProgress.maxXp) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {userProgress.xp}/{userProgress.maxXp} XP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="border-l-4 border-blue-500 pl-4"
            >
              <div className="text-sm text-gray-500">
                {formatRelativeTime(transaction.timestamp)}
              </div>
              <div className="text-gray-800 font-medium">
                {transaction.type}
              </div>
              <div className="text-gray-600 text-sm mt-1">
                {transaction.description}
              </div>
              <div className="mt-2 text-blue-600 text-sm">
                🤖 {transaction.aiExplanation}
              </div>
            </div>
          ))}

          {recentTransactions.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No transactions yet. Connect your wallet to get started!
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-2xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Total Transactions</h3>
          <p className="text-2xl font-bold text-gray-800">
            {recentTransactions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Current Level</h3>
          <p className="text-2xl font-bold text-gray-800">
            {userProgress.level}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">XP to Next Level</h3>
          <p className="text-2xl font-bold text-gray-800">
            {userProgress.maxXp - userProgress.xp}
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;