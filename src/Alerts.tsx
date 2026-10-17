
import { useCallback, useEffect, useState } from 'react'
import type { Stock } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Rules = {
  lo: number
  hi: number
  trend: boolean
}

type Row = {
  name: string
  rsi: number | null
  above: boolean | null
  flipped: boolean
}

type AlertItem = {
  id: string
  name: string
  text: string
  color: string
  icon: string
}

type Props = {
  card: string
  muted: string
  items: Stock[]
}

const DEFAULT_RULES: Rules = {
  lo: 30,
  hi: 70,
  trend: true,
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local storage may be unavailable.
  }
}

function validRules(value: unknown): Rules {
  if (!value || typeof value !== 'object') return DEFAULT_RULES

  const candidate = value as Partial<Rules>
  const lo =
    typeof candidate.lo === 'number' && Number.isFinite(candidate.lo)
      ? Math.max(0, Math.min(100, candidate.lo))
      : DEFAULT_RULES.lo

  const hi =
    typeof candidate.hi === 'number' && Number.isFinite(candidate.hi)
      ? Math.max(0, Math.min(100, candidate.hi))
      : DEFAULT_RULES.hi

  return {
    lo: Math.min(lo, hi),
    hi: Math.max(lo, hi),
    trend:
      typeof candidate.trend === 'boolean'
        ? candidate.trend
        : DEFAULT_RULES.trend,
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export default function Alerts({ card, muted, items }: Props) {
  const [rules, setRules] = useState<Rules>(() =>
    validRules(read<unknown>('pit-alert-rules', DEFAULT_RULES)),
  )
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  const itemKey = items
    .slice(0, 10)
    .map((stock) => `${stock.exch}:${stock.name}`)
    .join(',')

  const checkAlerts = useCallback(async (signal: AbortSignal) => {
    const list = items.slice(0, 10)

    if (list.length === 0) {
      setRows([])
      setLoading(false)
      setError('')
      setCheckedAt(new Date().toISOString())
      return
    }

    setLoading(true)
    setError('')

    try {
      const previous = read<Record<string, string>>('pit-alert-state', {})

      const results = await Promise.all(
        list.map(async (stock) => {
          const symbol =
            stock.exch === 'NSE' && !stock.name.endsWith('.NS')
              ? `${stock.name}.NS`
              : stock.name

          try {
            const response = await fetch(
              `${API}/analysis?symbol=${encodeURIComponent(symbol)}`,
              { signal },
            )

            if (!response.ok) {
              throw new Error(`Analysis request failed: ${response.status}`)
            }

            const data: unknown = await response.json()

            if (!data || typeof data !== 'object') {
              throw new Error('Invalid analysis response')
            }

            const analysis = data as {
              price?: unknown
              rsi?: unknown
              sma50?: unknown
            }

            if (!isNumber(analysis.price)) {
              return { name: stock.name, valid: false as const }
            }

            const rsi =
              isNumber(analysis.rsi) && analysis.rsi >= 0 && analysis.rsi <= 100
                ? analysis.rsi
                : null

            const above = isNumber(analysis.sma50)
              ? analysis.price > analysis.sma50
              : null

            const oldState = previous[stock.name]
            const currentState =
              above === null ? null : above ? 'up' : 'down'

            return {
              name: stock.name,
              valid: true as const,
              rsi,
              above,
              flipped:
                currentState !== null &&
                (oldState === 'up' || oldState === 'down') &&
                oldState !== currentState,
              currentState,
            }
          } catch (err) {
            if (signal.aborted) throw err
            return { name: stock.name, valid: false as const }
          }
        }),
      )

      if (signal.aborted) return

      const successful = results.filter(
        (result) => result.valid,
      )

      const nextStates = { ...previous }
      const nextRows: Row[] = []

      for (const result of successful) {
        if (!result.valid) continue

        if (result.currentState !== null) {
          nextStates[result.name] = result.currentState
        }

        nextRows.push({
          name: result.name,
          rsi: result.rsi,
          above: result.above,
          flipped: result.flipped,
        })
      }

      write('pit-alert-state', nextStates)
      setRows(nextRows)
      setCheckedAt(new Date().toISOString())

      if (successful.length === 0) {
        setError('Stock analysis data nahi mil raha. Backend ya connection check karo.')
      } else if (successful.length < list.length) {
        setError('Kuch stocks ka data load nahi hua. Results partial ho sakte hain.')
      }
    } catch {
      if (!signal.aborted) {
        setError('Alerts check nahi ho sake. Connection check karke retry karo.')
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [itemKey])

  useEffect(() => {
    const controller = new AbortController()
    void checkAlerts(controller.signal)

    return () => controller.abort()
  }, [checkAlerts, refreshKey])

  const save = (patch: Partial<Rules>) => {
    const next = validRules({ ...rules, ...patch })
    setRules(next)
    write('pit-alert-rules', next)
  }

  const alerts: AlertItem[] = []

  for (const row of rows) {
    if (row.rsi !== null && row.rsi <= rules.lo) {
      alerts.push({
        id: `${row.name}-oversold`,
        name: row.name,
        text: `RSI ${row.rsi.toFixed(1)} — oversold threshold (${rules.lo} or below)`,
        color: 'text-emerald-400',
        icon: '↓',
      })
    } else if (row.rsi !== null && row.rsi >= rules.hi) {
      alerts.push({
        id: `${row.name}-overbought`,
        name: row.name,
        text: `RSI ${row.rsi.toFixed(1)} — overbought threshold (${rules.hi} or above)`,
        color: 'text-amber-300',
        icon: '↑',
      })
    }

    if (rules.trend && row.flipped && row.above !== null) {
      alerts.push({
        id: `${row.name}-trend`,
        name: row.name,
        text: row.above
          ? 'Price crossed above its 50-day moving average'
          : 'Price crossed below its 50-day moving average',
        color: row.above ? 'text-emerald-400' : 'text-rose-400',
        icon: row.above ? '↗' : '↘',
      })
    }
  }

  const inputClass =
    'w-20 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-center text-sm text-white outline-none focus:border-violet-500'

  return (
    <section className={`mb-4 rounded-2xl ${card} border border-white/5 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">♢</span>
            <h2 className="text-base font-bold">Stock Alerts</h2>
            {alerts.length > 0 && (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-300">
                {alerts.length}
              </span>
            )}
          </div>
          <p className={`mt-1 text-xs ${muted}`}>
            RSI thresholds and 50-day trend changes
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            aria-label="Refresh alerts"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/5 disabled:opacity-40"
          >
            {loading ? '…' : '↻'}
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/5"
          >
            {open ? 'Close rules' : 'Rules'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="alert-rsi-low" className={`text-sm ${muted}`}>
              RSI oversold threshold
            </label>
            <input
              id="alert-rsi-low"
              type="number"
              min={0}
              max={100}
              value={rules.lo}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (Number.isFinite(value)) save({ lo: value })
              }}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="alert-rsi-high" className={`text-sm ${muted}`}>
              RSI overbought threshold
            </label>
            <input
              id="alert-rsi-high"
              type="number"
              min={0}
              max={100}
              value={rules.hi}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (Number.isFinite(value)) save({ hi: value })
              }}
              className={inputClass}
            />
          </div>

          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-medium">Trend changes</span>
              <span className={`mt-1 block text-xs ${muted}`}>
                Detect changes across the 50-day moving average
              </span>
            </span>
            <input
              type="checkbox"
              checked={rules.trend}
              onChange={(event) => save({ trend: event.target.checked })}
              className="h-4 w-4 accent-violet-500"
            />
          </label>

          <button
            type="button"
            onClick={() => save(DEFAULT_RULES)}
            className={`text-xs underline underline-offset-4 ${muted}`}
          >
            Reset default rules
          </button>
        </div>
      )}

      <div className="mt-4">
        {loading && (
          <div className="flex items-center gap-3 py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            <p className={`text-sm ${muted}`}>Checking stock data…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p role="status" className="text-sm text-amber-300">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-5 text-center">
            <p className="text-2xl">✓</p>
            <p className="mt-2 text-sm font-semibold">No active alerts</p>
            <p className={`mt-1 text-xs ${muted}`}>
              Abhi selected thresholds ke hisaab se koi alert detect nahi hua.
            </p>
          </div>
        )}

        {!loading &&
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="mb-2 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 last:mb-0"
            >
              <span className={`text-lg font-bold ${alert.color}`}>
                {alert.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{alert.name}</p>
                <p className={`mt-1 text-xs leading-relaxed ${alert.color}`}>
                  {alert.text}
                </p>
              </div>
            </div>
          ))}
      </div>

      <div className={`mt-4 border-t border-white/5 pt-3 text-xs ${muted}`}>
        <p>
          Monitoring watchlist ke pehle 10 stocks tak limited hai.
        </p>
        {checkedAt && (
          <p className="mt-1">
            Last checked: {new Date(checkedAt).toLocaleTimeString('en-IN')}
          </p>
        )}
        <p className="mt-2 leading-relaxed">
          Informational signals only, buy/sell recommendations nahi. Alerts
          app open hone par aur manual refresh par check hote hain. Background
          push notifications enabled nahi hain.
        </p>
      </div>
    </section>
  )
      }
