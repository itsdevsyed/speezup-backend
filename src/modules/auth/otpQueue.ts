import { Queue, Worker } from "bullmq";
import { redis } from "../../utils/redis";

export const otpQueue = new Queue("otpQueue", { connection: redis });

export const otpWorker = new Worker(
    'otpQueue',
    async job => {
        const {phone, otp} = job.data
        console.log('sending OTP ${otp} to phone ${phone}');
        return { status: 'sent' };
    },
     {connection:redis}
)
