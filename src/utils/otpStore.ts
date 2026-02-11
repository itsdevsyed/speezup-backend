 
import crypto from 'crypto';
import { redis } from '../utils/redis';

 
export const OTP_TTL = 120;
const OTP_SECRET = "some_super_long_random_string_12345"


const hashOtp = (otp: string) => {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(otp)
    .digest('hex');
};

export const saveOtp = async (phone: string, otp: string) => {
  const hashed = hashOtp(otp);
  await redis.set(`otp:${phone}`, hashed, 'EX', OTP_TTL);
};

export const verifyOtp = async (phone: string, otp: string) => {
  const stored = await redis.get(`otp:${phone}`);
  if (!stored) return false;

  const hashed = hashOtp(otp);

  if (stored === hashed) {
    await redis.del(`otp:${phone}`);
    return true;
  }

  return false;
};
