import { transactionAnalysisProvider } from '../../../agentkit/typescript/examples/langchain-cdp-chatbot/providers/TransactionAnalysisProvider';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

// Helper pour obtenir une transaction récente
async function getRecentTransaction(): Promise<string> {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const latestBlock = await provider.getBlock('latest');
  if (!latestBlock) throw new Error('Could not fetch latest block');
  
  // Prendre la première transaction du dernier block
  const txHash = latestBlock.transactions[0];
  return txHash;
}

async function testAnalysis() {
  console.log('Starting transaction analysis test...');

  const provider = transactionAnalysisProvider({
    basescanApiKey: process.env.BASESCAN_API_KEY,
    rpcUrl: process.env.BASE_RPC_URL,
    apiUrl: 'http://localhost:3000',
    apiKey: process.env.BACKEND_API_KEY
  });

  try {
    // 1. Obtenir une transaction récente
    const txHash = await getRecentTransaction();
    console.log(`\nTesting with transaction: ${txHash}`);

    // 2. Tester les différents niveaux d'utilisateur
    const userLevels = [1, 30, 80]; // Débutant, Intermédiaire, Avancé
    
    for (const level of userLevels) {
      console.log(`\n📊 Testing analysis for user level ${level}:`);
      console.log('----------------------------------------');
      
      const analysis = await provider.analyzeTransaction({
        txHash,
        userLevel: level,
        isNewTransaction: true
      });

      console.log(analysis);
      
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Tester le cache
    console.log('\n🔄 Testing cached response:');
    console.log('----------------------------------------');
    const cachedAnalysis = await provider.analyzeTransaction({
      txHash,
      userLevel: 1,
      isNewTransaction: false
    });
    console.log(cachedAnalysis);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Exécuter les tests
console.log('🚀 Starting tests...');
testAnalysis()
  .then(() => console.log('\n✅ Tests completed'))
  .catch(error => console.error('\n❌ Tests failed:', error))
  .finally(() => process.exit());