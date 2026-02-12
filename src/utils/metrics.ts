import { redis } from './redis';

/**
 * Increment a metric counter in Redis
 * Optionally set expiry to avoid stale metrics piling up
 */
export const incrementMetric = async (metric: string, ttlSeconds: number = 3600) => {
  const key = `metrics:${metric}`;
  const count = await redis.incr(key);

  // Set expiry if this is the first increment
  if (count === 1 && ttlSeconds > 0) {
    await redis.expire(key, ttlSeconds);
  }
};
