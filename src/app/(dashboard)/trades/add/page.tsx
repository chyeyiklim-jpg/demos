'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AssetType = 'stock' | 'crypto' | 'etf'
type Side = 'buy' | 'sell'
type Currency = 'USD' | 'MYR' | 'SGD' | 'JPY'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'MYR', label: 'RM — Malaysian Ringgit' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
]

interface FormState {
  symbol: string
  assetType: AssetType
  side: Side
  quantity: string
  price: string
  fee: string
  currency: Currency
  executedAt: string
  notes: string
}

const INITIAL: FormState = {
  symbol: '',
  assetType: 'stock',
  side: 'buy',
  quantity: '',
  price: '',
  fee: '0',
  currency: 'USD',
  executedAt: new Date().toISOString().slice(0, 10),
  notes: '',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition'

const selectCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition appearance-none'

export default function AddTradePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fxRate, setFxRate] = useState<number | null>(null)
  const [fxLoading, setFxLoading] = useState(false)

  function set(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (form.currency === 'USD') { setFxRate(1); return }
    setFxLoading(true)
    fetch('/api/fx-rates')
      .then(r => r.json())
      .then(rates => setFxRate(rates[form.currency] ?? null))
      .catch(() => setFxRate(null))
      .finally(() => setFxLoading(false))
  }, [form.currency])

  const qty = parseFloat(form.quantity) || 0
  const price = parseFloat(form.price) || 0
  const fee = parseFloat(form.fee) || 0
  const totalCost = qty * price + fee

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: form.symbol,
          assetType: form.assetType,
          side: form.side,
          quantity: form.quantity,
          price: form.price,
          fee: form.fee,
          currency: form.currency,
          executedAt: form.executedAt,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to record trade')
        return
      }
      router.push('/trades')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function fmt(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const currencySymbol: Record<Currency, string> = { USD: '$', MYR: 'RM ', SGD: 'S$', JPY: '¥' }
  const sym = currencySymbol[form.currency]

  const previewRows = [
    { label: 'Symbol', value: form.symbol.toUpperCase() || '—' },
    { label: 'Currency', value: form.currency },
    { label: 'Side', value: form.side ? form.side.charAt(0).toUpperCase() + form.side.slice(1) : '—' },
    { label: 'Quantity', value: qty > 0 ? String(qty) : '—' },
    { label: 'Price', value: price > 0 ? `${sym}${fmt(price)}` : '—' },
    { label: 'Fee', value: `${sym}${fmt(fee)}` },
    { label: 'Total Cost', value: totalCost > 0 ? `${sym}${fmt(totalCost)}` : '—' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold text-foreground">Add Trade</h1>
            <p className="text-sm text-muted-foreground">Record a new buy or sell transaction</p>
          </div>
          <Link
            href="/trades"
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-secondary hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 flex gap-6 items-start">
          {/* Left — form */}
          <div className="flex-1 bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-[15px] font-semibold text-foreground">Transaction Details</h2>
              <p className="text-xs text-primary">Fill in all fields to record the trade</p>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Symbol">
                <input
                  className={inputCls}
                  placeholder="e.g. AAPL, BTC"
                  value={form.symbol}
                  onChange={e => set('symbol', e.target.value)}
                  required
                />
              </Field>
              <Field label="Asset Type">
                <select
                  className={selectCls}
                  value={form.assetType}
                  onChange={e => set('assetType', e.target.value as AssetType)}
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                  <option value="etf">ETF</option>
                </select>
              </Field>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Side">
                <select
                  className={selectCls}
                  value={form.side}
                  onChange={e => set('side', e.target.value as Side)}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputCls}
                  placeholder="0.00"
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price per Unit ($)">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputCls}
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  required
                />
              </Field>
              <Field label="Fee ($)">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputCls}
                  placeholder="0.00"
                  value={form.fee}
                  onChange={e => set('fee', e.target.value)}
                />
              </Field>
            </div>

            {/* Currency + Execution Date */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Currency">
                <select
                  className={selectCls}
                  value={form.currency}
                  onChange={e => set('currency', e.target.value as Currency)}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Execution Date">
                <input
                  type="date"
                  className={inputCls}
                  value={form.executedAt}
                  onChange={e => set('executedAt', e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Notes */}
            <Field label="Notes (optional)">
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Add any notes about this trade…"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </Field>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/trades"
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-secondary hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? (
                  'Recording…'
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Record Trade
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right — preview */}
          <div className="w-64 flex flex-col gap-4">
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 className="text-[13px] font-semibold text-foreground">Trade Preview</h3>
              </div>

              <div className="flex flex-col divide-y divide-border">
                {previewRows.map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-xs font-semibold text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {form.currency !== 'USD' && (
              <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-foreground">FX Rate (live)</p>
                {fxLoading ? (
                  <p className="text-xs text-muted-foreground">Fetching rate…</p>
                ) : fxRate ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      1 USD = {fxRate.toFixed(4)} {form.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1 {form.currency} = {(1 / fxRate).toFixed(6)} USD
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-destructive">Rate unavailable</p>
                )}
              </div>
            )}

            <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-primary">How it works</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Average cost is automatically recalculated when you add multiple buys for the same symbol. Sell trades reduce your position quantity.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
