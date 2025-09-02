import { FastifyInstance } from 'fastify';
import { PrismaClient } from '../../../generated/prisma';
import { generateOtp } from '../../utils/otp';
import { saveOtp, verify, OTP_TTl } from '../../utils/otpStore';
import { otpQueue } from './otpQueue';
import { canRequestOtp } from '../../utils/rateLimiter';
import { incrementMetric } from '../../utils/metrics';
import crypto from "crypto";
import { sendOtpSchema, verifyOtpSchema } from '../../plugins/validation';

const prisma = new PrismaClient();


function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}


export async function otpRoutes(fastify: FastifyInstance) {
  // Decorator for success responses
  fastify.decorateReply('success', function (data: any, message = '', meta?: any) {
    return this.send({ success: true, data, message, meta });
  });

  // --- Send OTP ---
  fastify.post('/otp/send', async (request, reply) => {
    const parseResult = sendOtpSchema.safeParse(request.body);
    if (!parseResult.success) {
      // Access the first validation error
      const firstError = parseResult.error.issues[0];
      return reply.status(400).send({ success: false, message: firstError.message });
    }

    const { phone } = parseResult.data;
    if (!(await canRequestOtp(phone))) {

      return reply.status(429).send({ success: false, message: 'Too many requests' });
    }

    const otp = generateOtp();
    await saveOtp(phone, otp);
    console.log(otp)
    await otpQueue.add('otp', { phone, otp });
    await incrementMetric('otp_sent');

    return reply.success(null, 'OTP sent successfully', { ttl: OTP_TTl });
  });

  // --- Verify OTP ---
  fastify.post('/otp/verify', async (request, reply) => {
    const parseResult = verifyOtpSchema.safeParse(request.body);

    if (!parseResult.success) {

      const firstError = parseResult;
      return reply.status(400).send({ success: false, message: firstError });
    }
    const { phone, otp } = request.body as { phone: string; otp: string };
    if (!phone || !otp) return reply.status(400).send({ success: false, message: 'OTP missing' });

    const isValid = await verify(phone, otp);
    if (!isValid) return reply.status(400).send({ success: false, message: 'Invalid OTP' });

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, email: `${phone}@speezyup.local` },
    });

    const accessToken = fastify.jwt.sign({ userId: user.id, phone }, { expiresIn: '15m' });
    const refreshToken = fastify.jwt.sign({ userId: user.id, phone }, { expiresIn: '7d' });
    const hashedToken = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    reply
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({ success: true, accessToken, expires_in: 900 });
  });

  // --- Get User Profile ---
  fastify.get('/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) return reply.status(404).send({ success: false, message: 'User not found' });
    return reply.send({ success: true, user });
  });

  // --- Logout ---
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const refreshToken = request.cookies.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
    }

    reply.clearCookie('refreshToken', { path: '/' }).send({ success: true, message: 'Logged out' });
  });
}
