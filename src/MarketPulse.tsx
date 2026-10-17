
import { useEffect, useState } from 'react'
import { getPulse } from './pulseApi'
import type { MarketPulseData } from './pulseApi'

type Props = {
  card: string
  muted: string
}

const moodStyles: Record<string, string> = {
  Bullish: 'bg-emerald-500/15 text-emerald-400',
  Neutral: 'bg-zinc-500/15 text-zinc-400',
  Recovering: 'bg-amber-500/15 text-amber-400',
  Weak: 'bg-rose-500/15 text-rose-400',
  Unknown: 'bg-zinc-500/15 text-zinc-400',
}

const moodHints: Record<string, string> = {
  Bullish: 'Trend aur daily movement positive hain.',
  Neutral: 'Longer trend positive hai, lekin aaj pullback hai.',
  Recovering: 'Longer trend weak hai, lekin daily movement positive hai.',
  Weak: 'Trend aur daily movement dono weak hain.',
  Unknown: 'Market mood abhi determine nahi hua.',
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
    <div className="rounded-xl bg-white/5 p-3">
      <p className={`text-xs ${muted}`}>{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

export default function MarketPulse({ card, muted }: Props) {
  const [data, setData] = useState<MarketPulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    getPulse()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className={`mx-4 mt-5 rounded-2xl ${card} border border-white/5 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Market Pulse</h2>
          <p className={`mt-1 text-xs ${muted}`}>
            Nifty trend aur market breadth
          </p>
        </div>

        {data && !error && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              moodStyles[data.mood] ?? moodStyles.Unknown
            }`}
          >
            {data.mood}
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-5">
          <div className="h-7 w-32 animate-pulse rounded bg-white/10" />
          <p className={`mt-3 text-sm ${muted}`}>
            Market data load ho raha hai…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 rounded-xl bg-white/5 p-4">
          <p className="text-sm font-medium">
            Market data abhi available nahi hai.
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            Backend ya market data provider baad mein try karna.
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setError(false)
              getPulse()
                .then(setData)
                .catch(() => setError(true))
                .finally(() => setLoading(false))
            }}
            className="mt-3 rounded-lg bg-violet-500/15 px-3 py-2 text-sm text-violet-400"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.nifty && (
            <div className="mt-5">
              <p className={`text-xs ${muted}`}>Nifty 50</p>
              <p className="mt-1 text-3xl font-bold">
                {data.nifty.price.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p
                className={`mt-1 text-sm font-medium ${
                  data.nifty.change_percent >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {data.nifty.change_percent > 0 ? '+' : ''}
                {data.nifty.change_percent.toFixed(2)}% today
              </p>
            </div>
          )}

          <p className={`mt-3 text-xs leading-5 ${muted}`}>
            {moodHints[data.mood] ?? moodHints.Unknown}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric
              label="Stocks above SMA 50"
              value={`${data.breadth.above_sma50} / ${data.breadth.total}`}
              muted={muted}
            />
            <Metric
              label="Market breadth"
              value={`${data.breadth.percent}%`}
              muted={muted}
            />
          </div>

          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, data.breadth.percent)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className={`mt-4 flex items-center justify-between text-xs ${muted}`}>
            <span>Updated: {data.updated || '—'}</span>
            {data.cached && <span>Cached data</span>}
          </div>
        </>
      )}

      <p className={`mt-4 text-[10px] leading-4 ${muted}`}>
        Market indicators historical price data par based hain. Ye guaranteed
        prediction ya buy/sell recommendation nahi hain.
      </p>
    </section>
  )
}
