import Redis from 'ioredis'

let instance: Redis | null = null

const noop = {
  get: async () => null,
  set: async () => null,
} as unknown as Redis

export function getRedis(): Redis {
  if (!process.env.REDIS_URL) return noop
  if (!instance) {
    instance = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
    instance.on('error', () => {})
  }
  return instance
}

export const cache = getRedis()
