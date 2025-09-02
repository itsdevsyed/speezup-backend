import { FastifyInstance } from "fastify";

export const userRoutes = async (fastify: FastifyInstance) => {

  fastify.get('/user/me', {
    preValidation: [fastify.authenticate]
  }, async (request: any, reply) => {
    const userPhone = request.user.phone; // extracted from JWT
    return { success: true, user: { phone: userPhone } };
  });

};
