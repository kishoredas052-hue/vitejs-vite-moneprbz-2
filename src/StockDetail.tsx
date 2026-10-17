
import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Analysis = {
  price?: number
  change_percent?: number
  rsi?: number
  sma50?: number
  sma200?: number
  pe?: number
  volume?: number
  recommendation?: string
  verdict?: string
  error?: string
}

type Props = {
  stock: Stock
  card: string
  muted: string
  t: T
  added: boolean
  onToggle: (name: string) => void
  onBack: () => void
}

function Metric({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted: string
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <p className={`text-xs ${muted}`}>{label}</p>
      <p className="mt-2 break-words text-lg font-semibold tabular-nums">
        {value}
      </p>
    </div>
  )
}

function formatNumber(value: number | undefined, digits = 2) {
  if (value === undefined || !Number.isFinite(value)) return '—'

  return value.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export default function StockDetail({
  stock,
  card,
  muted,
  t,
  added,
  onToggle,
  onBack,
}: Props) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadAnalysis() {
      setLoading(true)
      setError('')
      setAnalysis(null)

      const symbol =
        stock.exch === 'NSE' ? `${stock.name}.NS` : stock.name

      try {
        const response = await fetch(
          `${API}/analysis?symbol=${encodeURIComponent(symbol)}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data: Analysis = await response.json()

        if (!controller.signal.aborted) {
          setAnalysis(data)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError('Analysis data abhi available nahi hai. Thodi der baad try karo.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadAnalysis()

    return () => controller.abort()
  }, [stock.name, stock.exch])

  const price =
    typeof analysis?.price === 'number'
      ? analysis.price
      : Number(stock.price)

  const hasPrice = Number.isFinite(price) && price > 0
  const change =
    typeof analysis?.change_percent === 'number'
      ? analysis.change_percent
      : stock.change

  const currency =
    stock.exch === 'NASDAQ' || stock.exch === 'NYSE' ? '$' : '₹'

  const verdict = analysis?.verdict ?? analysis?.recommendation
  const positive = change >= 0

  return (
    <main className="px-4 pb-8 pt-5">
      <button
        type="button"
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm ${muted} transition hover:text-violet-400`}
      >
        <span aria-hidden="true">←</span>
        {t.back}
      </button>

      <section className={`${card} rounded-3xl border border-white/5 p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs uppercase tracking-widest ${muted}`}>
              Stock overview
            </p>
            <h2 className="mt-2 break-words text-2xl font-bold">
              {stock.name}
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>{stock.exch}</p>
          </div>

          <span className="rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-medium text-violet-300">
            Research
          </span>
        </div>

        <div className="mt-6">
          <p className={`text-xs ${muted}`}>Latest available price</p>

          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {hasPrice
              ? `${currency}${price.toLocaleString(
                  stock.exch === 'NSE' ? 'en-IN' : 'en-US',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                )}`
              : '—'}
          </p>

          <p
            className={`mt-2 text-sm font-semibold ${
              positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {positive ? '+' : ''}
            {formatNumber(change)}%
            <span className={`ml-2 font-normal ${muted}`}>
              daily change
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggle(stock.name)}
          className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
            added
              ? 'border border-violet-500/40 bg-violet-500/10 text-violet-300'
              : 'bg-violet-600 text-white hover:bg-violet-500'
          }`}
        >
          {added ? `✓ ${t.inWatch}` : `＋ ${t.addToWatch}`}
        </button>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Technical indicators</h3>
          {loading && (
            <span className={`text-xs ${muted}`}>Loading…</span>
          )}
        </div>

        {error && (
          <div
            role="status"
            className={`${card} mb-3 rounded-xl border border-amber-500/20 p-4 text-sm ${muted}`}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="RSI (14)"
            value={formatNumber(analysis?.rsi)}
            muted={muted}
          />
          <Metric
            label="P/E ratio"
            value={formatNumber(analysis?.pe)}
            muted={muted}
          />
          <Metric
            label="SMA 50"
            value={
              typeof analysis?.sma50 === 'number'
                ? `${currency}${formatNumber(analysis.sma50)}`
                : '—'
            }
            muted={muted}
          />
          <Metric
            label="SMA 200"
            value={
              typeof analysis?.sma200 === 'number'
                ? `${currency}${formatNumber(analysis.sma200)}`
                : '—'
            }
            muted={muted}
          />
          <Metric
            label="Volume"
            value={
              typeof analysis?.volume === 'number'
                ? formatNumber(analysis.volume, 0)
                : '—'
            }
            muted={muted}
          />
          <Metric
            label="Data status"
            value={loading ? 'Loading' : analysis ? 'Received' : 'Unavailable'}
            muted={muted}
          />
        </div>
      </section>

      <section className={`${card} mt-6 rounded-2xl border border-white/5 p-5`}>
        <h3 className="font-semibold">Analysis summary</h3>

        {loading ? (
          <p className={`mt-2 text-sm ${muted}`}>
            Market analysis load ho raha hai…
          </p>
        ) : verdict ? (
          <p className="mt-2 text-sm leading-6">{verdict}</p>
        ) : (
          <p className={`mt-2 text-sm leading-6 ${muted}`}>
            Abhi koi summary available nahi hai. Technical indicators ko
            context ke saath dekho; sirf ek indicator ke basis par decision
            mat lo.
          </p>
        )}
      </section>

      <p className={`mt-5 text-xs leading-5 ${muted}`}>
        Market data delayed ya unavailable ho sakta hai. RSI aur moving
        averages research indicators hain, guaranteed buy/sell signals nahi.
        Investment decision se pehle apni research karo.
      </p>
    </main>
  )
}
