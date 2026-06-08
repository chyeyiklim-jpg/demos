import { NextResponse } from 'next/server'
import { getAllFxRates } from '@/lib/fx/frankfurter'

export async function GET() {
  try {
    const rates = await getAllFxRates()
    return NextResponse.json(rates, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
