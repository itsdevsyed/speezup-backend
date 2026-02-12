import { redis } from "./redis";

const OTP_RATE_LIMIT = 5;        // Max OTP requests
const OTP_RATE_WINDOW = 60;      // Window in seconds

/**
 * Checks if a user can request an OTP
 * Uses both phone number + IP for rate limiting
 */
export const canRequestOtp = async (phone: string, ip: string) => {
    const key = `otp:rate:${phone}:${ip}`; // multi-factor rate-limit key
    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, OTP_RATE_WINDOW);
    }

    return count <= OTP_RATE_LIMIT;
};
