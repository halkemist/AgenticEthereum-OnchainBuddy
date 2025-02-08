import { Request, Response, NextFunction } from 'express';

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey || apiKey !== process.env.AGENT_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};