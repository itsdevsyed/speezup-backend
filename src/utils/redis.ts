import IORedis from 'ioredis';

export const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // required by BullMQ v5+
});

redis.on('connect', () => console.log('Connected to Redis/Memurai'));
redis.on('error', (err) => console.error('Redis error:', err));
