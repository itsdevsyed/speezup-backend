import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { JwtPayload } from "../../types/fastify";

export const storeRoutes = async (fastify: FastifyInstance) => {

    // Guard: Only STORE_OWNER can create store
    const authorizeStoreOwner = async (request: FastifyRequest, reply: FastifyReply) => {
        // request.user is already populated by fastify.authenticate
        const user = request.user as JwtPayload;

        if (user.role !== "STORE_OWNER") {
            return reply.code(403).send({ success: false, message: "Forbidden" });
        }
    };

    fastify.post(
        "/",
        {
            preHandler: [fastify.authenticate, authorizeStoreOwner],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as JwtPayload;
            const { userId } = user;
            const { prisma } = fastify;

            try {
                const { name, description, phone, latitude, longitude } = request.body as {
                    name: string;
                    description?: string;
                    phone?: string;
                    latitude: number;
                    longitude: number;
                };

                if (!name || latitude == null || longitude == null) {
                    return reply.code(400).send({ success: false, message: "Name and location required" });
                }

                const store = await prisma.store.create({
                    data: {
                        name,
                        description,
                        phone,
                        owner: { connect: { id: userId } },
                        address: {
                            create: {
                                latitude,
                                longitude,
                                street: "",
                                city: "",
                                state: "",
                                postalCode: "",
                                country: "",
                            },
                        },
                    },
                    include: { address: true },
                });

                return reply.send({ success: true, store });
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ success: false, message: "Internal Server Error" });
            }
        }
    );
};
