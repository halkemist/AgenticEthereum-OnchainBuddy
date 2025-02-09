import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Auth middleware
const authenticate = async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  if (apiKey !== process.env.BACKEND_API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
};

// Error handler wrapper
const errorHandler = (fn) => async (request, reply) => {
  try {
    return await fn(request, reply);
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Add auth to all routes
fastify.addHook('preHandler', authenticate);

// Routes
fastify.post('/progress', errorHandler(async (request, reply) => {
  const progress = request.body;
  const saved = await prisma.userProgress.upsert({
    where: { address: progress.address },
    update: progress,
    create: progress
  });
  return saved;
}));

fastify.get('/progress/:address', errorHandler(async (request, reply) => {
  const { address } = request.params;
  const progress = await prisma.userProgress.findUnique({
    where: { address },
    include: { achievements: true }
  });
  return progress || {
    address,
    xp: 0,
    level: 1,
    transactionsAnalyzed: 0,
    lastUpdate: new Date(),
    achievements: []
  };
}));

fastify.post('/explanation', errorHandler(async (request, reply) => {
  const explanation = request.body;
  const saved = await prisma.transactionExplanation.create({
    data: explanation
  });
  return saved;
}));

fastify.post('/check-achievements', errorHandler(async (request, reply) => {
  const { userProgress, context } = request.body;

  const existingAchievements = await prisma.achievement.findMany({
    where: { userAddress: userProgress.address }
  });

  const newAchievements = [];

  if (userProgress.transactionsAnalyzed >= 10 && 
      !existingAchievements.some(a => a.name === "Analyzer Novice")) {
    newAchievements.push({
      name: "Analyzer Novice",
      description: "Analyzed 10 transactions",
      xpReward: 100,
      dateUnlocked: new Date(),
      userAddress: userProgress.address
    });
  }

  if (newAchievements.length > 0) {
    await prisma.achievement.createMany({
      data: newAchievements
    });
  }

  return newAchievements;
}));

fastify.get('/achievements/:address', errorHandler(async (request, reply) => {
  const { address } = request.params;
  
  const achievements = await prisma.achievement.findMany({
    where: { userAddress: address }
  });
  
  return achievements;
}));

const start = async () => {
  try {
    await fastify.register(cors, {
      origin: true
    });

    await fastify.listen({ port: 3002 });
    console.log('Server running at http://localhost:3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();