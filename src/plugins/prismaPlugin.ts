import fp from "fastify-plugin";
import { PrismaClient } from "../../generated/prisma-client/client";

const prisma = new PrismaClient();

export default fp(async (fastify) => {
  fastify.decorate("prisma", prisma);
});
