import { Queue, Worker, Job } from "bullmq";
import { redis } from "../../utils/redis";

// Queue to handle OTP sending
export const otpQueue = new Queue("otpQueue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,                  // retry 3 times if failed
        backoff: { type: "exponential", delay: 2000 }, // exponential backoff
        removeOnComplete: true,       // clean Redis after success
        removeOnFail: false,          // keep failed jobs for inspection
    },
});

// Worker to process OTP jobs
export const otpWorker = new Worker(
    "otpQueue",
    async (job: Job) => {
        const { phone, otp } = job.data;

        // Simulate sending OTP via SMS provider
        try {
            console.log(`Sending OTP to phone ${phone} with OTP: ${otp}`);
            // TODO: integrate with actual SMS provider like Twilio
            // await twilio.messages.create({ to: phone, body: `Your OTP is ${otp}` });

            // Mark success
            return { status: "sent" };
        } catch (err) {
            console.error(`Failed to send OTP to ${phone}:`, err);
            throw err; // BullMQ will retry automatically
        }
    },
    { connection: redis }
);

// Logging for completed/failed jobs
otpWorker.on("completed", (job) => {
    console.log(`OTP job ${job.id} completed successfully`);
});

otpWorker.on("failed", (job, err) => {
    console.error(`OTP job ${job?.id} failed:`, err);
});
