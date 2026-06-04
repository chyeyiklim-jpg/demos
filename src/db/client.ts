import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const syncUrl = process.env.LIBSQL_SYNC_URL
const validSync = syncUrl && !syncUrl.includes('YOUR_VPS_IP') && syncUrl.startsWith('http')

const client = createClient({
  url: process.env.LIBSQL_URL ?? 'file:local.db',
  ...(validSync ? { syncUrl, authToken: process.env.LIBSQL_AUTH_TOKEN } : {}),
})

export const db = drizzle(client, { schema })
export { client }
