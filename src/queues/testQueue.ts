import { Queue, Worker } from 'bullmq';
import { redis } from '../utils/redis';

// Queue
export const testQueue = new Queue('testQueue', { connection: redis });

// Worker
export const testWorker = new Worker(
  'testQueue',
  async job => {
    console.log('Processing job:', job.data);
    return { status: 'done' };
  },
  { connection: redis }
);
