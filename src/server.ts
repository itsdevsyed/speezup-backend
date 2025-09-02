import Fastify from 'fastify';
import mercurius from 'mercurius';
import dotenv from 'dotenv';
import cookie from '@fastify/cookie';
import { redis } from './utils/redis';
import { otpRoutes } from './modules/auth/otpRoutes';
import { otpWorker } from './modules/auth/otpQueue';
import { testQueue } from './queues/testQueue';
import jwtPlugin from './plugins/jwt';
import { userRoutes } from './modules/user/userRoutes';
import responseWrapper from './plugins/responseWrapper';

dotenv.config();

const fastify = Fastify({
  logger: true,
  bodyLimit: 1048576,
});

// Register plugins
fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'supersecret', // for signed cookies
  hook: 'onRequest',
});
fastify.register(responseWrapper);
fastify.register(jwtPlugin);

// Register routes
fastify.register(otpRoutes);
fastify.register(userRoutes);

// GraphQL schema & resolvers
const schema = `
  type Query {
    hello: String
    redisPing: String
  }

  type Mutation {
    addJob(message: String!): Boolean
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
    redisPing: async () => await redis.ping(),
  },
  Mutation: {
    addJob: async (_: any, { message }: { message: string }) => {
      await testQueue.add(
        'job',
        { message },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }
      );
      return true;
    },
  },
};

fastify.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
});

// Queue workers
otpWorker.on('completed', job => console.log(`OTP job ${job.id} completed`));
otpWorker.on('failed', (job, err) =>
  console.log(`OTP job ${job?.id} failed:`, err)
);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 4000 });
    console.log('Server running at http://localhost:4000');
    console.log('GraphiQL UI: http://localhost:4000/graphiql');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
