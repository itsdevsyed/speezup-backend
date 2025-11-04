import { redis } from "./redis";

const OTP_RATE_LIMIT = 5 ;
const OTP_RATE_WINDOW = 60 ;

export const canRequestOtp = async (phone:string) => {
const key = `otp:rate:${phone}`;
const count = await redis.incr(key);

    if(count === 1 ){
        await redis.expire(key , OTP_RATE_WINDOW);

    }

    return count <= OTP_RATE_LIMIT;

}

