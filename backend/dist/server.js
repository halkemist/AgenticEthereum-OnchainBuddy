import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import initializeAgent from "./langchain-cdp-chatbot/chatbot";
const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();
let agentInstance;
// Init agent
async function initAgent() {
    try {
        const { agent, config } = await initializeAgent();
        agentInstance = { agent, config };
        console.log('Agent initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize agent:', error);
        process.exit(1);
    }
}
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
    }
    catch (error) {
        fastify.log.error(error);
        reply.status(500).send({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknow errpr'
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
        where: { address }
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
fastify.post('/api/monitor', errorHandler(async (request, reply) => {
    const { address } = request.body;
    if (!agentInstance) {
        throw new Error('Agent not initialized');
    }
    const result = await agentInstance.agent.invoke({
        messages: [{
                type: "human",
                content: `Monitor address ${address}`
            }]
    });
    return { status: 'success', data: result };
}));
// Run the server
const start = async () => {
    try {
        await initAgent();
        await fastify.register(cors, {
            origin: true
        });
        await fastify.listen({ port: 3000 });
        console.log('Server running at http://localhost:3000');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
