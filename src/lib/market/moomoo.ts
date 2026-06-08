import { exec } from 'child_process'
import { promisify } from 'util'
import type { MarketPrice } from '@/types/domain'

const execAsync = promisify(exec)

interface MoomooPosition {
  code: string
  name: string
  qty: number
  nominal_price: number
  today_pl_val?: number
  volume?: number
}

function symbolFromCode(code: string): string {
  return code.split('.').slice(1).join('.')
}

export async function fetchPricesFromMoomoo(): Promise<MarketPrice[]> {
  const accId = process.env.MOOMOO_ACC_ID
  const firm = process.env.MOOMOO_SECURITY_FIRM
  const script = process.env.MOOMOO_SCRIPT_PATH

  if (!accId || !firm || !script) return []

  const { stdout, stderr } = await execAsync(
    `python3 "${script}" --trd-env REAL --acc-id ${accId} --security-firm ${firm} --json`,
    { timeout: 30000 }
  )

  const jsonLine = [...stdout.split('\n'), ...stderr.split('\n')]
    .find(l => l.trim().startsWith('{'))

  if (!jsonLine) return []

  const data = JSON.parse(jsonLine)
  const positions: MoomooPosition[] = data.positions ?? []

  return positions
    .filter(p => p.qty > 0 && p.nominal_price > 0)
    .map(p => {
      const price = p.nominal_price
      const todayChange = p.today_pl_val ?? 0
      const prevClose = price - todayChange / (p.qty > 0 ? 1 : 1)
      const changePct = prevClose > 0 ? (todayChange / (prevClose * 1)) * 100 : 0

      return {
        symbol: symbolFromCode(p.code),
        price,
        change: todayChange,
        changePct,
        volume: p.volume ?? 0,
        fetchedAt: new Date(),
      }
    })
}
