import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Auth middleware
const authenticate = async (request, reply) => {
  const apiKey = request.headers['x-api-key'];

  if (apiKey !== process.env.API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' })
    return;
  }
}

// Add our auth to all routes
fastify.addHook('preHandler', authenticate);

// Routes
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' })
});

// Run the server
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});