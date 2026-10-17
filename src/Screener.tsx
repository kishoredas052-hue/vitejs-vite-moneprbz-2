
import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Result = {
  symbol: string
  price: number
  rsi: number | null
  pe: number | null
  score: number
  verdict: string
  reasons?: string[]
}

type Sug = { name: string; symbol: string }

type Props = {
  card: string
  muted: string
  t: T
  onOpen: (s: Stock) => void
  searchOnly?: boolean
}

const RSI_OPTIONS = [30, 40, 50, 70]
const PE_OPTIONS = [25, 40, 1000]

const TREND_OPTIONS = [
  { value: 'any', label: 'Any trend' },
  { value: 'up', label: 'Uptrend' },
  { value: 'down', label: 'Downtrend' },
]

function toStock(sym: string): Stock {
  return {
    name: sym.replace(/\.NS$/i, '').toUpperCase(),
    exch: 'NSE',
    price: '',
    change: 0,
  }
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}

export default function Screener({
  card,
  muted,
  onOpen,
  searchOnly,
}: Props) {
  const [q, setQ] = useState('')
  const [sugs, setSugs] = useState<Sug[]>([])
  const [mkt, setMkt] = useState<'NSE' | 'US'>('NSE')
  const [maxRsi, setMaxRsi] = useState(40)
  const [maxPe, setMaxPe] = useState(1000)
  const [trend, setTrend] = useState('any')
  const [results, setResults] = useState<Result[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [screenError, setScreenError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const term = q.trim()

    if (mkt !== 'NSE' || term.length < 2) {
      setSugs([])
      setSearchError('')
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API}/symbols?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Search service unavailable')
        }

        const data = await response.json()

        if (!cancelled) {
          setSugs(Array.isArray(data.items) ? data.items : [])
          setSearchError('')
        }
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          setSugs([])
          setSearchError('Suggestions load nahi hui. Symbol seedha enter kar sakte ho.')
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [q, mkt])

  useEffect(() => {
    if (searchOnly) return

    const controller = new AbortController()
    let cancelled = false

    async function loadScreener() {
      setLoading(true)
      setScreenError('')
      setResults(null)

      try {
        const params = new URLSearchParams({
          max_rsi: String(maxRsi),
          max_pe: String(maxPe),
          trend,
        })

        const response = await fetch(
          `${API}/screener?${params.toString()}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Server response: ${response.status}`)
        }

        const data = await response.json()

        if (!Array.isArray(data.results)) {
          throw new Error('Unexpected response from screener')
        }

        if (!cancelled) setResults(data.results)
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          setResults([])
          setScreenError(
            'Screener abhi load nahi ho raha. Backend ko wake hone ke liye 30–60 seconds lag sakte hain.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadScreener()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [maxRsi, maxPe, trend, searchOnly, refreshKey])

  const openSymbol = (symbol: string) => {
    const clean = symbol.trim().toUpperCase().replace(/\.NS$/i, '')
    if (!clean) return

    onOpen({
      name: clean,
      exch: mkt === 'NSE' ? 'NSE' : 'NASDAQ',
      price: '',
      change: 0,
    })

    setQ('')
    setSugs([])
    setSearchError('')
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-2 text-xs font-semibold transition ${
      active
        ? 'bg-violet-600 text-white shadow-md shadow-violet-950/30'
        : `border border-white/10 ${muted} hover:border-violet-400/60`
    }`

  const heading = 'mb-3 text-lg font-bold tracking-tight'

  const searchBlock = (
    <div className={`rounded-2xl ${card} space-y-4 border border-white/5 p-4`}>
      <div className="flex gap-2">
        <button
          type="button"
          className={chip(mkt === 'NSE')}
          onClick={() => setMkt('NSE')}
        >
          🇮🇳 NSE / India
        </button>
        <button
          type="button"
          className={chip(mkt === 'US')}
          onClick={() => setMkt('US')}
        >
          🇺🇸 US Stocks
        </button>
      </div>

      <div className="relative">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            openSymbol(q)
          }}
        >
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={
              mkt === 'NSE'
                ? 'Company ya symbol, jaise Reliance'
                : 'Symbol, jaise NVDA ya AAPL'
            }
            aria-label="Search stock symbol"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <button
            type="submit"
            disabled={!q.trim()}
            className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kholo
          </button>
        </form>

        {mkt === 'NSE' && sugs.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
            {sugs.map((suggestion) => (
              <button
                type="button"
                key={suggestion.symbol}
                onClick={() => openSymbol(suggestion.symbol)}
                className="flex w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-3 text-left last:border-0 hover:bg-violet-500/10"
              >
                <span className="font-semibold text-white">
                  {suggestion.symbol}
                </span>
                <span className={`truncate text-right text-xs ${muted}`}>
                  {suggestion.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={`text-xs leading-relaxed ${muted}`}>
        Company ka naam ya ticker symbol enter karo. NSE ke liye suggestions
        available hain agar backend search endpoint response deta hai.
      </p>

      {searchError && (
        <p role="status" className="text-xs text-amber-400">
          {searchError}
        </p>
      )}
    </div>
  )

  if (searchOnly) {
    return <div>{searchBlock}</div>
  }

  return (
    <section className="mx-4 mt-6 pb-5">
      <div className="mb-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
          Discover opportunities
        </p>
        <h2 className="text-2xl font-bold tracking-tight">Stock Screener</h2>
        <p className={`mt-1 text-sm ${muted}`}>
          Technical aur valuation filters se stocks explore karo.
        </p>
      </div>

      <h3 className={heading}>Search stocks</h3>
      {searchBlock}

      <div className="mb-4 mt-7 flex items-center justify-between gap-3">
        <div>
          <h3 className={heading}>Smart Filters</h3>
          <p className={`text-xs ${muted}`}>
            Apne criteria ke hisaab se results filter karo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/5 disabled:opacity-40"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div className={`space-y-5 rounded-2xl ${card} border border-white/5 p-4`}>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${muted}`}>Maximum RSI</p>
            <span className="rounded-lg bg-violet-500/15 px-2 py-1 text-xs font-bold text-violet-300">
              {maxRsi}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {RSI_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                className={chip(maxRsi === value)}
                onClick={() => setMaxRsi(value)}
              >
                RSI ≤ {value}
              </button>
            ))}
          </div>
          <p className={`mt-2 text-xs ${muted}`}>
            Lower RSI can indicate weaker recent momentum; it does not
            guarantee a rebound.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${muted}`}>Maximum P/E</p>
            <span className="rounded-lg bg-violet-500/15 px-2 py-1 text-xs font-bold text-violet-300">
              {maxPe === 1000 ? 'Any' : maxPe}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PE_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                className={chip(maxPe === value)}
                onClick={() => setMaxPe(value)}
              >
                {value === 1000 ? 'Any P/E' : `P/E ≤ ${value}`}
              </button>
            ))}
          </div>
          <p className={`mt-2 text-xs ${muted}`}>
            P/E ko company ke sector aur growth ke context mein compare karna
            chahiye.
          </p>
        </div>

        <div>
          <p className={`mb-2 text-sm font-semibold ${muted}`}>Price trend</p>
          <div className="flex flex-wrap gap-2">
            {TREND_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={chip(trend === option.value)}
                onClick={() => setTrend(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Results</h3>
        {results !== null && !loading && (
          <span className={`text-xs ${muted}`}>
            {results.length} stocks found
          </span>
        )}
      </div>

      {loading && (
        <div className={`rounded-2xl ${card} p-6 text-center`}>
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          <p className="text-sm font-medium">Scanning stocks…</p>
          <p className={`mt-1 text-xs ${muted}`}>
            Backend ko response dene mein thoda time lag sakta hai.
          </p>
        </div>
      )}

      {!loading && screenError && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p role="alert" className="text-sm text-amber-300">
            {screenError}
          </p>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !screenError && results?.length === 0 && (
        <div className={`rounded-2xl ${card} p-6 text-center`}>
          <div className="mb-2 text-2xl">⌕</div>
          <p className="font-semibold">No matching stocks</p>
          <p className={`mt-1 text-sm ${muted}`}>
            Filters badal kar dekho ya baad mein refresh karo.
          </p>
        </div>
      )}

      {!loading &&
        !screenError &&
        results?.map((result) => {
          const positive = result.score > 0
          const negative = result.score < 0

          return (
            <button
              type="button"
              key={result.symbol}
              onClick={() => onOpen(toStock(result.symbol))}
              className={`mb-3 flex w-full items-center justify-between gap-3 rounded-2xl ${card} border border-white/5 p-4 text-left transition hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-950/10`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">
                  {result.symbol.replace(/\.NS$/i, '')}
                </p>

                <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs ${muted}`}>
                  <span>RSI: {result.rsi?.toFixed(1) ?? '—'}</span>
                  <span>P/E: {result.pe?.toFixed(1) ?? '—'}</span>
                </div>

                {result.reasons && result.reasons.length > 0 && (
                  <p className={`mt-2 line-clamp-2 text-xs ${muted}`}>
                    {result.reasons.slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-bold text-white">
                  ₹{formatPrice(result.price)}
                </p>
                <span
                  className={`mt-2 inline-block max-w-32 rounded-lg px-2 py-1 text-xs font-semibold ${
                    positive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : negative
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-zinc-500/10 text-zinc-300'
                  }`}
                >
                  {result.verdict || 'Neutral'}
                </span>
              </div>
            </button>
          )
        })}

      <p className={`mt-5 text-center text-xs leading-relaxed ${muted}`}>
        Screening results are informational, based on available backend data,
        and are not personalized investment advice or guaranteed returns.
      </p>
    </section>
  )
                }
