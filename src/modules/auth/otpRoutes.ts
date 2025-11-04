import { FastifyInstance } from "fastify";
import { generateOtp } from "../../utils/otp";
import { saveOtp, verify, OTP_TTl } from "../../utils/otpStore";
import { otpQueue } from "./otpQueue";
import { canRequestOtp } from "../../utils/rateLimiter";
import { incrementMetric } from "../../utils/metrics";

export const otpRoutes = async (fastify: FastifyInstance) => {
  // ---------------------
  // SEND OTP
  // ---------------------
  fastify.post("/send", async (request, reply) => {
    try {
      const { phone } = request.body as { phone: string };

      if (!phone || !/^\d{10}$/.test(phone)) {
        return reply.code(400).send({
          success: false,
          message: "Invalid phone number",
        });
      }

      if (!(await canRequestOtp(phone))) {
        return reply.code(429).send({
          success: false,
          message: "Too many requests. Try again later.",
        });
      }

      const otp = generateOtp();
      await saveOtp(phone, otp);
      await otpQueue.add("otp", { phone, otp });
      await incrementMetric("otp_sent");

      fastify.log.info(`OTP generated for ${phone} → ${otp}`);

      return reply.send({
        success: true,
        message: "OTP sent successfully",
        ttl: OTP_TTl,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply
        .code(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  });

  // ---------------------
  // VERIFY OTP
  // ---------------------
  fastify.post("/verify", async (request, reply) => {
    try {
      const { phone, otp } = request.body as { phone: string; otp: string };

      if (!phone || !otp) {
        return reply
          .code(400)
          .send({ success: false, message: "Phone and OTP required" });
      }

      const isValid = await verify(phone, otp);
      if (!isValid) {
        return reply
          .code(400)
          .send({ success: false, message: "Invalid or expired OTP" });
      }

      // ✅ Get prisma instance from fastify plugin
      const { prisma } = fastify;

      // ✅ Find or create user
      let user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            email: `${phone}@speezyup.local`,
            role: "CUSTOMER",
          },
        });
      }

      // 🔒 Invalidate old refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // 🟢 Generate new tokens
      const accessToken = fastify.jwt.sign(
        { userId: user.id, phone: user.phone },
        { expiresIn: "15m" }
      );

      const refreshToken = fastify.jwt.sign(
        { userId: user.id },
        { expiresIn: "30d" }
      );

      // 💾 Store refresh token in DB
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await incrementMetric("otp_verified");

      // ✅ Respond
      return reply.send({
        success: true,
        accessToken,
        refreshToken,
        expires_in: 900, // 15 min
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply
        .code(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  });
};
