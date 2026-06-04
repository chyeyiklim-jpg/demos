import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const positions = sqliteTable('positions', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  assetType: text('asset_type', { enum: ['stock', 'crypto', 'etf'] }).notNull(),
  quantity: text('quantity').notNull(),
  avgCost: text('avg_cost').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),
  positionId: text('position_id').references(() => positions.id),
  symbol: text('symbol').notNull(),
  side: text('side', { enum: ['buy', 'sell'] }).notNull(),
  quantity: text('quantity').notNull(),
  price: text('price').notNull(),
  fee: text('fee').default('0'),
  executedAt: integer('executed_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  condition: text('condition', { enum: ['above', 'below'] }).notNull(),
  threshold: text('threshold').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  triggeredAt: integer('triggered_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
