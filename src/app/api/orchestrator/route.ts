import { NextResponse } from 'next/server'
import { OrchestratorAgent } from '@/agents/orchestrator.agent'

const orchestrator = new OrchestratorAgent()

export async function GET() {
  const result = await orchestrator.getDashboard()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
