import { describe, it, expect } from 'vitest'
import { client } from '@/db/client'

describe('db client', () => {
  it('connects to local SQLite database', async () => {
    const result = await client.execute('SELECT 1 as value')
    expect(result.rows[0]).toEqual({ value: 1 })
  })
})
