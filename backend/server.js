import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Auth middleware
const authenticate = async (request, reply) => {
  const apiKey = request.headers['x-api-key'];

  if (apiKey !== process.env.BACKEND_API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' })
    return;
  }
}

// Add our auth to all routes
fastify.addHook('preHandler', authenticate);

// Routes
fastify.get('/progress', async (request, reply) => {
  const progress = request.body;
  const saved = await prisma.userProgress.upsert({
    where: { address: progress.address },
    update: progress,
    create: progress
  });
  return saved;
});

fastify.get('/progress/:address', async (request, reply) => {
  const { address } = request.params;
  const progress = await prisma.userProgress.findUnique({
    where: { address }
  });
  return progress || {
    address,
    xp: 0,
    level: 1,
    transactionsAnalyzed: 0,
    lastUpdate: Date.now(),
    achievements: []
  };
});

fastify.post('/explanation', async (request, reply) => {
  const explanation = request.body;
  const saved = await prisma.transactionExplanation.create({
    data: explanation
  });
  return saved;
});

fastify.get('/explanation/:txHash', async (request, reply) => {
  const { txHash } = request.params;
  const userLevel = parseInt(request.query.userLevel) || 1;
  
  const explanation = await prisma.transactionExplanation.findFirst({
    where: { 
      transactionHash: txHash,
      userLevel
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return explanation;
});

// Run the server
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});