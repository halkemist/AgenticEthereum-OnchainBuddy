import express from 'express';
import { AgentService } from '../services/AgentService';
import { authenticateApiKey } from '../middleware/auth';

const router = express.Router();

// Auth Middleware
router.use(authenticateApiKey);

// GET /api/agent/health - Check Service Health
router.get('/health', (req, res) => {
  const agentService = req.app.locals.agentService as AgentService;
  
  res.json({
    status: 'healthy',
    initialized: agentService.initialized,
    timestamp: new Date().toISOString()
  });
});

// POST /api/agent/monitor - Start Address Monitoring
router.post('/monitor', async (req: express.Request, res: any) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address provided'
      });
    }

    const agentService = req.app.locals.agentService as AgentService;
    const result = await agentService.startMonitoring(address);

    return res.json(result);
  } catch (error) {
    console.error('Error in monitor endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// POST /api/agent/stop - Stop Address Monitoring
router.post('/stop', async (req: express.Request, res: any) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address provided'
      });
    }

    const agentService = req.app.locals.agentService as AgentService;
    const result = await agentService.stopMonitoring(address);

    return res.json(result);
  } catch (error) {
    console.error('Error in stop endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// GET /api/agent/status/:address - Check Address Monitoring Status
router.get('/status/:address', (req: express.Request, res: any) => {
  try {
    const { address } = req.params;
    const agentService = req.app.locals.agentService as AgentService;
    const status = agentService.getMonitoringStatus(address);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    return res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// GET /api/agent/addresses - Get all monitored addresses
router.get('/addresses', (req, res) => {
  try {
    const agentService = req.app.locals.agentService as AgentService;
    const addresses = agentService.getAllMonitoredAddresses();

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error in addresses endpoint:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;