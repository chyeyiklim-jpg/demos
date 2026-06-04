import type { AgentResult } from '@/types/agents'
import { fail } from '@/types/agents'

export abstract class BaseAgent {
  protected readonly name: string

  constructor(name: string) {
    this.name = name
  }

  protected async run<T>(fn: () => Promise<AgentResult<T>>): Promise<AgentResult<T>> {
    try {
      return await fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return fail(`[${this.name}] ${message}`, 'NETWORK_ERROR')
    }
  }
}
