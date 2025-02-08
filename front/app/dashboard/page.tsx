'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { SmartToy as BotIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockchainEducatorAgent, BackendAPI } from '../utils/api';
import { type Transaction, type Stats, type UserProgress, type Notification } from "./../lib/types";

const Dashboard: React.FC = () => {
  const { address } = useAccount();
  const [api, setApi] = useState<BlockchainEducatorAgent | null>(null);

  // States
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    xp: 250,
    maxXp: 1000
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTransactions: 0,
    uniqueContracts: 0,
    defiInteractions: 0,
    riskLevel: 'safe'
  });

  // Initialize API and monitoring
  useEffect(() => {
    if (address) {
      const newApi = new BlockchainEducatorAgent();
      setApi(newApi);

      const initAgent = async () => {
        await newApi.initialize();
      };
    
      initAgent();
      
      // Start monitoring
      newApi.monitorAddress(address);
      
      // Load initial user progress
      loadUserProgress();
    }
  }, [address]);

  const loadUserProgress = async () => {
    if (!api) return;
    
    const backendApi = new BackendAPI(
      process.env.NEXT_PUBLIC_BACKEND_API_KEY || '', 
      process.env.NEXT_PUBLIC_BACKEND_API_URL || ''
    )
    return await backendApi.getUserProgress(address as `0x${string}`);
  };

  const addNotification = ({ message, type }: { message: string, type: 'achievement' | 'levelUp' }) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg"
          >
            {notif.type === 'levelUp' ? '🎉' : '🏆'} {notif.message}
          </motion.div>
        ))}
      </AnimatePresence>

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
              No transactions yet. Start interacting with the blockchain to see your activity!
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-2xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Total Transactions</h3>
          <p className="text-2xl font-bold text-gray-800">
            {stats.totalTransactions}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">DeFi Interactions</h3>
          <p className="text-2xl font-bold text-gray-800">
            {stats.defiInteractions}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Risk Level</h3>
          <p className={`text-2xl font-bold ${
            stats.riskLevel === 'safe' ? 'text-green-600' : 
            stats.riskLevel === 'warning' ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {stats.riskLevel.toUpperCase()}
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
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">Unique Contracts</h3>
          <p className="text-2xl font-bold text-gray-800">
            {stats.uniqueContracts}
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;