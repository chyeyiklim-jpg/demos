import Redis from 'ioredis'

let instance: Redis | null = null

export function getRedis(): Redis {
  if (!instance) {
    instance = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })
  }
  return instance
}

export const cache = getRedis()
