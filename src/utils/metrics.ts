import { redis } from './redis';

export const incrementMetric = async (metric: string) => {
  await redis.incr(`metrics:${metric}`);
};
