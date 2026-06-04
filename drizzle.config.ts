import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.LIBSQL_URL ?? 'file:local.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  },
} satisfies Config
