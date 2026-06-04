import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.LIBSQL_URL ?? 'file:local.db',
  syncUrl: process.env.LIBSQL_SYNC_URL,
  authToken: process.env.LIBSQL_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
export { client }
