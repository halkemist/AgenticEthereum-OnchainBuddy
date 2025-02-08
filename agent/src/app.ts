import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";

function validateEnvironment() {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'CDP_API_KEY_NAME',
    'CDP_API_KEY_PRIVATE_KEY',
    'BASESCAN_API_KEY',
    'BASE_RPC_URL',
    'BACKEND_API_KEY',
    'BACKEND_API_URL'
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
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
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

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Server runnning at port ' + PORT);
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;