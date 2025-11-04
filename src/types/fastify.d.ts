import "fastify";
import { PrismaClient } from "../../generated/prisma";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any; // keep your existing type
    prisma: PrismaClient; // ✅ add this line
  }

  interface FastifyRequest {
    user: {
      phone: string;
    };
  }
}
