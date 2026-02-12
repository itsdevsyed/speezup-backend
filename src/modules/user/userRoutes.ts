import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { JwtPayload } from "../../types/fastify";

export const userRoutes = async (fastify: FastifyInstance) => {
  // Get current user details
  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as JwtPayload;
      const { prisma } = fastify;

      // Optionally fetch full user details from DB
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, phone: true, name: true, role: true },
      });

      return reply.send({ success: true, user: userDetails });
    }
  );
};
