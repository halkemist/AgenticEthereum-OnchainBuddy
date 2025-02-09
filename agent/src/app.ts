import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import agentRoutes from "./api/agentRoutes";
import { createAgentService } from "./services/AgentService";

function validateEnvironment() {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'CDP_API_KEY_NAME',
    'CDP_API_KEY_PRIVATE_KEY',
    'BASESCAN_API_KEY',
    'BASE_RPC_URL',
    'AGENT_API_KEY',
    'AGENT_API_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`- ${varName}`);
    });
    process.exit(1);
  }
}

// Initial config
dotenv.config();
validateEnvironment();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json());

// Initialize Agent
const agentService = createAgentService({
  apiKeyName: process.env.CDP_API_KEY_NAME!,
  apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!,
  networkId: process.env.NETWORK_ID || 'base-mainnet',
  openAIApiKey: process.env.OPENAI_API_KEY!,
  basescanApiKey: process.env.BASESCAN_API_KEY!,
  baseRpcUrl: process.env.BASE_RPC_URL!,
  backendApiKey: process.env.AGENT_API_KEY!,
  backendApiUrl: process.env.AGENT_API_URL!
});

// Store service in local to use it in routes
app.locals.agentService = agentService;

// Routes
app.use('/api/agent', agentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_END === 'development' ? err.message : undefined
  });
});

// Initialization Function
async function initializeApp() {
  try {
    await agentService.initialize();
    
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start Application
initializeApp();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;