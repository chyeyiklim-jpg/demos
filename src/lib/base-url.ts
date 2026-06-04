import { headers } from 'next/headers'

export async function baseUrl() {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${proto}://${host}`
}
