import { transactionAnalysisProvider } from "../../providers/TransactionAnalysisProvider";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function testOpenAIConnection() {
  console.log('Testing OpenAI connection...');
  const testLlm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  try {
    const response = await testLlm.invoke("Say hello");
    console.log('OpenAI test response:', response);
    return true;
  } catch (error) {
    console.error('OpenAI test failed:', error);
    return false;
  }
}

// Helper pour obtenir une transaction récente
async function getRecentTransaction() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const latestBlock = await provider.getBlock('latest');
  if (!latestBlock) throw new Error('Could not fetch latest block');
  
  // Prendre la première transaction du dernier block
  const txHash = latestBlock.transactions[0];
  return txHash;
}

async function testAnalysis() {
  console.log('Starting transaction analysis test...');

  // Test OpenAI first
  const openAIWorks = await testOpenAIConnection();
  if (!openAIWorks) {
    console.error('OpenAI connection failed, stopping tests');
    return;
  }

  // Initialiser le LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
    maxRetries: 3,
    cache: false,
    streaming: false
  });

  // Initialiser le provider
  const provider = transactionAnalysisProvider({
    basescanApiKey: process.env.BASESCAN_API_KEY,
    rpcUrl: process.env.BASE_RPC_URL,
    apiUrl: 'http://localhost:3000',
    apiKey: process.env.BACKEND_API_KEY
  });

  // Important: Définir le modèle llm
  provider.setLLM(llm);

  try {
    // Obtenir une transaction récente
    const txHash = await getRecentTransaction();
    console.log(`\nTesting with transaction: ${txHash}`);

    // Tester les différents niveaux d'utilisateur
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