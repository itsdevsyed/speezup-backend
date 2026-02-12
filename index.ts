import Fastify from "fastify";
import mercurius from "mercurius";
import dotenv from "dotenv";
import { redis } from "./src/utils/redis";
import { otpRoutes } from "./src/modules/auth/otpRoutes";
import { otpWorker } from "./src/modules/auth/otpQueue";
import { testQueue } from "./src/queues/testQueue";
import { userRoutes } from "./src/modules/user/userRoutes";
import { storeRoutes } from "./src/modules/store/storeRoutes";
import responseWrapper from "./src/plugins/responseWrapper";
import prismaPlugin from "./src/plugins/prismaPlugin";
import jwtAuth from "./src/plugins/jwt";
import { JwtPayload } from "./src/types/fastify";

dotenv.config();

console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL || "(not found)");

const fastify = Fastify({
  logger: true,
  bodyLimit: 1048576,
});

// Register plugins in the correct order
fastify.register(responseWrapper);
fastify.register(prismaPlugin);
fastify.register(jwtAuth); // JWT must be registered before routes that use it




// Register routes
fastify.register(otpRoutes, { prefix: "/otp" });
fastify.register(userRoutes, { prefix: "/user" });
fastify.register(storeRoutes, { prefix: "/store" });

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
    hello: () => "Hello World!",
    redisPing: async () => await redis.ping(),
  },
  Mutation: {
    addJob: async (_: any, { message }: { message: string }) => {
      await testQueue.add(
        "job",
        { message },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
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

otpWorker.on("completed", (job) =>
  console.log(`OTP job ${job.id} completed`)
);
otpWorker.on("failed", (job, err) =>
  console.error(` OTP job ${job?.id} failed:`, err)
);

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: "0.0.0.0" });
    console.log("Server running at http://localhost:4000");
    console.log("GraphiQL UI at: http://localhost:4000/graphiql");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
