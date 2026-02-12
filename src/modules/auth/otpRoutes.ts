import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { generateOtp } from "../../utils/otp";
import { saveOtp, verifyOtp, OTP_TTL } from "../../utils/otpStore";
import { otpQueue } from "./otpQueue";
import { canRequestOtp } from "../../utils/rateLimiter";
import { incrementMetric } from "../../utils/metrics";
// Role-based guard (can reuse for other routes)
export const authorize = (roles: string[]) => async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userRole = (request.user as any)?.role;
  if (!roles.includes(userRole)) {
    return reply.code(403).send({ success: false, message: "Forbidden" });
  }
};

export const otpRoutes = async (fastify: FastifyInstance) => {
  // -------------------- SEND OTP --------------------
  fastify.post("/send", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phone } = request.body as { phone: string };

      // Extract client IP
      const ipHeader = request.headers["x-forwarded-for"];
      const ip =
        request.ip ||
        (Array.isArray(ipHeader) ? ipHeader[0] : ipHeader) ||
        "";

      // Validate phone
      if (!phone || !/^\d{10}$/.test(phone)) {
        return reply.code(400).send({ success: false, message: "Invalid phone number" });
      }

      // Multi-factor rate-limit
      if (!(await canRequestOtp(phone, ip))) {
        return reply.code(429).send({ success: false, message: "Too many requests. Try again later." });
      }

      // Generate & hash OTP
      const otp = generateOtp();
      await saveOtp(phone, otp);

      // Async delivery via queue
      await otpQueue.add("otp", { phone, otp });

      await incrementMetric("otp_sent");

      // Log safely (without OTP)
      fastify.log.info(`OTP generated for phone: ${phone}`);

      return reply.send({ success: true, message: "OTP sent successfully and the OTP is" ,  ttl: OTP_TTL ,   });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, message: "Internal Server Error" });
    }
  });

  // -------------------- VERIFY OTP --------------------
  fastify.post("/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phone, otp, role } = request.body as {
        phone: string; otp: string, role?: "CUSTOMER" | "STORE_OWNER" | "DELIVERY_PARTNER";
};

      if (!phone || !otp) {
        return reply.code(400).send({ success: false, message: "Phone and OTP required" });
      }

      const isValid = await verifyOtp(phone, otp);
      if (!isValid) {
        return reply.code(400).send({ success: false, message: "Invalid or expired OTP" });
      }

      const { prisma } = fastify;

      // Find or create user
      let user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            email: `${phone}@speezyup.local`,
            role: role ?? "CUSTOMER"
          },
        });
      }

      // Invalidate old refresh tokens (logs out all devices)
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

      // Generate access + refresh tokens
      const accessToken = fastify.jwt.sign(
        { userId: user.id, phone: user.phone, role: user.role },
        { expiresIn: "15m" }
      );

      const refreshToken = fastify.jwt.sign(
        { userId: user.id },
        { expiresIn: "30d" }
      );

      // Store refresh token in DB
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await incrementMetric("otp_verified");

      return reply.send({
        success: true,
        accessToken,
        refreshToken,
        expires_in: 900, // 15 min
        user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, message: "Internal Server Error" });
    }
  });
};
