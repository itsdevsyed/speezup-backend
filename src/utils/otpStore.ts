import { redis } from '../utils/redis';

export const  OTP_TTl = 120;

export const saveOtp = async (phone: string, otp: string) => {
  await redis.set(`otp:${phone}`, otp, 'EX', OTP_TTl);
};

export const verify = async (phone: string, otp: string) => {
  const stored = await redis.get(`otp:${phone}`);
  if (stored && stored === otp) {
    await redis.del(`otp:${phone}`);
    return true;
  }
  return false;
};
