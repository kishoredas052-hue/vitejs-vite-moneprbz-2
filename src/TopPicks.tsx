
import { useEffect, useState } from 'react'
import type { Stock, T } from './data'
import { stocks } from './data'

type Props = {
  card: string
  muted: string
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (stock: Stock) => void
}

type Analysis = {
  price?: number
  change_percent?: number
  rsi?: number
  pe?: number
  recommendation?: string
  verdict?: string
  error?: string
}

const API = 'https://pro-investment-backend.onrender.com'

const fallbackPicks = [
  'RELIANCE',
  'HDFCBANK',
  'ICICIBANK',
  'INFY',
  'TCS',
]

export default function TopPicks({
  card,
  muted,
  t,
  watch,
  onToggle,
  onOpen,
}: Props) {
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadPicks() {
      setLoading(true)

      const results = await Promise.all(
        fallbackPicks.map(async (name) => {
          const symbol = name.endsWith('.NS') ? name : `${name}.NS`

          try {
            const response = await fetch(
              `${API}/analysis?symbol=${encodeURIComponent(symbol)}`
            )

            if (!response.ok) throw new Error('Analysis unavailable')

            const data = (await response.json()) as Analysis
            return [name, data] as const
          } catch {
            return [name, {} as Analysis] as const
          }
        })
      )

      if (active) {
        setAnalyses(Object.fromEntries(results))
        setLoading(false)
      }
    }

    void loadPicks()

    return () => {
      active = false
    }
  }, [])

  const picks = fallbackPicks
    .map((name) => {
      const stock = stocks.find((item) => item.name === name)
      if (!stock) return null

      return {
        stock,
        analysis: analyses[name] ?? {},
      }
    })
    .filter(
      (item): item is { stock: Stock; analysis: Analysis } =>
        item !== null
    )

  return (
    <section className="mx-4 mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t.topPicks}</h2>
          <p className={`mt-1 text-xs ${muted}`}>
            Research shortlist · Not guaranteed winners
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500">
          {picks.length} stocks
        </span>
      </div>

      {loading && (
        <p className={`mb-3 text-sm ${muted}`}>
          Fetching latest analysis…
        </p>
      )}

      <div className="space-y-3">
        {picks.map(({ stock, analysis }) => {
          const isWatched = watch.includes(stock.name)
          const price =
            typeof analysis.price === 'number' &&
            Number.isFinite(analysis.price)
              ? analysis.price
              : Number(stock.price)

          const change =
            typeof analysis.change_percent === 'number' &&
            Number.isFinite(analysis.change_percent)
              ? analysis.change_percent
              : stock.change

          const hasPrice = Number.isFinite(price) && price > 0
          const verdict =
            analysis.recommendation ?? analysis.verdict ?? ''

          return (
            <article
              key={stock.name}
              className={`${card} rounded-2xl border border-white/5 p-4`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpen(stock)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h3 className="truncate font-semibold">
                    {stock.name}
                  </h3>

                  <p className={`mt-1 text-xs ${muted}`}>
                    {stock.exch} · {stock.name}.NS
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onToggle(stock.name)}
                  aria-label={
                    isWatched
                      ? `Remove ${stock.name} from watchlist`
                      : `Add ${stock.name} to watchlist`
                  }
                  className={`rounded-xl px-3 py-2 text-sm ${
                    isWatched
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-white/5'
                  }`}
                >
                  {isWatched ? '★ Saved' : '☆ Save'}
                </button>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className={`text-xs ${muted}`}>Latest price</p>
                  <p className="mt-1 text-lg font-semibold">
                    {hasPrice
                      ? `₹${price.toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                        })}`
                      : '—'}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      change >= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {Number.isFinite(change)
                      ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
                      : '—'}
                  </p>

                  <p className={`mt-1 text-xs ${muted}`}>
                    Daily change
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {typeof analysis.rsi === 'number' && (
                  <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
                    RSI {analysis.rsi.toFixed(1)}
                  </span>
                )}

                {typeof analysis.pe === 'number' && (
                  <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
                    P/E {analysis.pe.toFixed(1)}
                  </span>
                )}

                {verdict && (
                  <span className="rounded-lg bg-sky-500/10 px-2 py-1 text-xs text-sky-500">
                    {verdict}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpen(stock)}
                className="mt-4 w-full rounded-xl bg-sky-500/10 py-2.5 text-sm font-medium text-sky-500"
              >
                View analysis →
              </button>
            </article>
          )
        })}
      </div>

      <p className={`mt-3 text-xs leading-5 ${muted}`}>
        These stocks are a research shortlist, not personalized investment
        advice. Check fundamentals, valuation, risk and your own goals
        before investing.
      </p>
    </section>
  )
                        }
