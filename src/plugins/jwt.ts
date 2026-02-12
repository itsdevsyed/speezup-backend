import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";
import { JwtPayload } from "../types/fastify";

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "supersecret",
    sign: { expiresIn: "15m" },
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        request.user = request.user as JwtPayload;
      } catch (err) {
        // ✅ Use plain reply code instead of fastify.httpErrors
        reply.code(401).send({ success: false, message: "Unauthorized" });
      }
    }
  );
});
