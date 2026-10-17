
import { useEffect, useState } from 'react'
import type { Stock, T } from './data'
import { getPulse, type PulseStock } from './pulseApi'

type Props = {
  card: string
  muted: string
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (stock: Stock) => void
}

function formatPrice(price: number) {
  if (!Number.isFinite(price)) return '—'

  return price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function Movers({
  card,
  muted,
  t,
  watch,
  onToggle,
  onOpen,
}: Props) {
  const [gainers, setGainers] = useState<PulseStock[]>([])
  const [losers, setLosers] = useState<PulseStock[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    getPulse()
      .then((data) => {
        if (cancelled) return
        setGainers(Array.isArray(data.gainers) ? data.gainers : [])
        setLosers(Array.isArray(data.losers) ? data.losers : [])
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const renderRow = (item: PulseStock) => {
    const isUp = item.change_percent >= 0
    const added = watch.includes(item.symbol)

    const stock: Stock = {
      name: item.symbol,
      exch: 'NSE',
      price: String(item.price),
      change: item.change_percent,
    }

    return (
      <article
        key={item.symbol}
        className={`${card} flex items-center justify-between gap-3 rounded-xl border border-white/5 p-4`}
      >
        <button
          type="button"
          onClick={() => onOpen(stock)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-semibold">{item.symbol}</p>
          <p className={`mt-1 text-xs ${muted}`}>NSE · View analysis</p>
        </button>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">
            ₹{formatPrice(item.price)}
          </p>
          <p
            className={`mt-1 text-sm font-medium ${
              isUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isUp ? '+' : ''}
            {Number.isFinite(item.change_percent)
              ? item.change_percent.toFixed(2)
              : '—'}
            %
          </p>

          <button
            type="button"
            onClick={() => onToggle(item.symbol)}
            className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
              added
                ? 'bg-violet-500/20 text-violet-400'
                : 'bg-white/5 text-zinc-400'
            }`}
          >
            {added ? `★ ${t.inWatch}` : `☆ ${t.addToWatch}`}
          </button>
        </div>
      </article>
    )
  }

  return (
    <section className="mx-4 mt-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{t.marketMovers}</h2>
        <p className={`mt-1 text-xs ${muted}`}>
          Aaj ke strongest aur weakest price moves
        </p>
      </div>

      {loading && (
        <div className={`${card} rounded-xl p-4`}>
          <p className={`text-sm ${muted}`}>
            Market movers load ho rahe hain…
          </p>
        </div>
      )}

      {!loading && failed && (
        <div className={`${card} rounded-xl p-4`}>
          <p className={`text-sm ${muted}`}>
            Market movers abhi load nahi hue. Backend status check karo.
          </p>
        </div>
      )}

      {!loading && !failed && gainers.length === 0 && losers.length === 0 && (
        <div className={`${card} rounded-xl p-4`}>
          <p className={`text-sm ${muted}`}>
            Abhi movers ka data available nahi hai.
          </p>
        </div>
      )}

      {gainers.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              ↗
            </span>
            <h3 className="text-sm font-semibold">Top Gainers</h3>
          </div>

          <div className="space-y-3">{gainers.map(renderRow)}</div>
        </div>
      )}

      {losers.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
              ↘
            </span>
            <h3 className="text-sm font-semibold">Top Losers</h3>
          </div>

          <div className="space-y-3">{losers.map(renderRow)}</div>
        </div>
      )}

      <p className={`mt-4 text-[10px] leading-4 ${muted}`}>
        Price moves sirf daily performance dikhate hain; ye buy/sell advice
        nahi hai. Data delay ho sakta hai.
      </p>
    </section>
  )
}
