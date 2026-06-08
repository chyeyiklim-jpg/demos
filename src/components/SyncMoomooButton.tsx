'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncMoomooButton() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [summary, setSummary] = useState('')

  async function handleSync() {
    setState('loading')
    setSummary('')
    try {
      const res = await fetch('/api/sync/moomoo', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setState('error')
        setSummary(data.error ?? 'Sync failed')
        return
      }
      const created = data.results.filter((r: { action: string }) => r.action === 'created').length
      const updated = data.results.filter((r: { action: string }) => r.action === 'updated').length
      setState('done')
      setSummary(`${created} added, ${updated} updated`)
      router.refresh()
    } catch {
      setState('error')
      setSummary('Network error')
    } finally {
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {summary && (
        <span className={`text-xs ${state === 'error' ? 'text-destructive' : 'text-success'}`}>
          {summary}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-secondary hover:bg-muted transition-colors disabled:opacity-60"
      >
        <svg className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        {state === 'loading' ? 'Syncing…' : 'Sync moomoo'}
      </button>
    </div>
  )
}
