import Fastify from "fastify";
import prismaPlugin from "./plugins/prismaPlugin";
import { otpRoutes } from "./modules/auth/otpRoutes";

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  // Register plugins
  await fastify.register(prismaPlugin);

  // Register routes
  await fastify.register(otpRoutes, { prefix: "/auth" });

  return fastify;
}
