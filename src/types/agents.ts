export type AgentErrorCode =
  | 'NETWORK_ERROR'
  | 'DB_ERROR'
  | 'VALIDATION_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'CACHE_ERROR'
  | 'AI_ERROR'

export type AgentResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: AgentErrorCode }

export function ok<T>(data: T): AgentResult<T> {
  return { success: true, data }
}

export function fail(error: string, code: AgentErrorCode): AgentResult<never> {
  return { success: false, error, code }
}
