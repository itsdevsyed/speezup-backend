import "fastify";
import { PrismaClient } from "../../generated/prisma-client/client";
import { FastifyJWT } from "@fastify/jwt";

// Define the payload stored in JWT
export interface JwtPayload {
  userId: number;
  phone: string;
  role: "CUSTOMER" | "STORE_OWNER" | "DELIVERY_PARTNER";
}

declare module "fastify" {
  interface FastifyRequest {
    user: JwtPayload;
  }

  interface FastifyInstance {
    prisma: PrismaClient;

    // JWT plugin
    jwt: FastifyJWT<JwtPayload>;

    // JWT auth preHandler
    authenticate: (
      request: FastifyRequest,
      reply: import("fastify").FastifyReply
    ) => Promise<void>;
  }
}
