import crypto from 'crypto';
import { redis } from '../utils/redis';
import dotenv from 'dotenv';
dotenv.config();

export const OTP_TTL = 120; // seconds
const OTP_SECRET = process.env.OTP_SECRET;
if (!OTP_SECRET) throw new Error("OTP_SECRET is not defined in environment variables");

const OTP_MAX_ATTEMPTS = 5;

// Hash OTP with secret
const hashOtp = (otp: string) => {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(otp)
    .digest('hex');
};

// Save OTP in Redis
export const saveOtp = async (phone: string, otp: string) => {
  const hashed = hashOtp(otp);
  await redis.set(`otp:${phone}`, hashed, 'EX', OTP_TTL);
  await redis.set(`otp:attempts:${phone}`, 0, 'EX', OTP_TTL); // reset attempt counter
};

// Verify OTP with attempt limit
export const verifyOtp = async (phone: string, otp: string) => {
  const stored = await redis.get(`otp:${phone}`);
  if (!stored) return false;

  const attemptKey = `otp:attempts:${phone}`;
  const attempts = parseInt((await redis.get(attemptKey)) || '0');

  if (attempts >= OTP_MAX_ATTEMPTS) return false; // exceeded max attempts

  const hashed = hashOtp(otp);
  if (stored === hashed) {
    await redis.del(`otp:${phone}`);
    await redis.del(attemptKey);
    return true;
  }

  await redis.incr(attemptKey);
  await redis.expire(attemptKey, OTP_TTL); // reset expiry with OTP TTL
  return false;
};
