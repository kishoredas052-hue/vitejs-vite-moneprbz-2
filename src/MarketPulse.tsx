import { useEffect, useState } from 'react'

const API = 'https://pro-investment-backend.onrender.com'

type Item = { symbol: string; price: number; change_percent: number }

type Pulse = {
  mood: string
  nifty: { price: number; change_percent: number; above_sma50: boolean } | null
  breadth: { above_sma50: number; total: number; percent: number }
  gainers: Item[]
  losers: Item[]
  updated: string
  error?: string
}

type Props = {
  card: string
  muted: string
}

const MOOD_STYLE: Record<string, string> = {
  Bullish: 'bg-green-500/20 text-green-400',
  Neutral: 'bg-zinc-600/40 text-zinc-300',
  Recovering: 'bg-yellow-500/20 text-yellow-300',
  Weak: 'bg-red-500/20 text-red-400',
  Unknown: 'bg-zinc-700 text-zinc-300',
}

const MOOD_HINT: Record<string, string> = {
  Bullish: 'Nifty 50-din average ke upar, aaj bhi upar',
  Neutral: 'Nifty 50-din average ke upar, aaj neeche (pullback)',
  Recovering: 'Nifty 50-din average ke neeche, lekin aaj upar',
  Weak: 'Nifty 50-din average ke neeche, aur aaj bhi neeche',
  Unknown: 'Data abhi nahi aaya',
}

export default function MarketPulse({ card, muted }: Props) {
  const [data, setData] = useState<Pulse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/market-pulse`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setData({ error: 'load nahi hua' } as Pulse)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className={`mx-4 mt-5 rounded-2xl ${card} p-5`}>
        <p className={`text-sm ${muted}`}>Market Pulse load ho raha hai...</p>
        <p className={`text-xs ${muted} mt-1`}>Pehli baar 30-90 second lag sakte hain.</p>
      </section>
    )
  }

  if (!data || data.error || !data.breadth) {
    return (
      <section className={`mx-4 mt-5 rounded-2xl ${card} p-5`}>
        <p className={`text-sm ${muted}`}>Market Pulse abhi available nahi hai.</p>
      </section>
    )
  }

  const moodClass = MOOD_STYLE[data.mood] ?? MOOD_STYLE.Unknown
  const niftyUp = (data.nifty?.change_percent ?? 0) >= 0

  return (
    <section className={`mx-4 mt-5 rounded-2xl ${card} p-5`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${muted}`}>Market Pulse</p>
        <span className={`text-xs px-3 py-1 rounded-full ${moodClass}`}>{data.mood}</span>
      </div>

      {data.nifty && (
        <div className="mt-3">
          <p className="text-2xl font-bold">
            {data.nifty.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={niftyUp ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
            {niftyUp ? '+' : ''}
            {data.nifty.change_percent.toFixed(2)}% (Nifty 50)
          </p>
        </div>
      )}

      <p className={`text-xs ${muted} mt-2`}>{MOOD_HINT[data.mood] ?? ''}</p>

      <div className="mt-4">
        <p className={`text-xs ${muted} mb-1`}>
          Breadth: {data.breadth.above_sma50} / {data.breadth.total} stocks 50-din average ke upar
        </p>
        <div className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden">
          <div
            className="h-2 bg-violet-500"
            style={{ width: `${Math.min(100, data.breadth.percent)}%` }}
          />
        </div>
        <p className={`text-xs ${muted} mt-1`}>{data.breadth.percent}%</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className={`text-xs ${muted} mb-2`}>Top gainers</p>
          {data.gainers.slice(0, 3).map((g) => (
            <div key={g.symbol} className="flex justify-between text-xs py-1">
              <span>{g.symbol}</span>
              <span className="text-green-400">+{g.change_percent.toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div>
          <p className={`text-xs ${muted} mb-2`}>Top losers</p>
          {data.losers.slice(0, 3).map((l) => (
            <div key={l.symbol} className="flex justify-between text-xs py-1">
              <span>{l.symbol}</span>
              <span className="text-red-400">{l.change_percent.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      <p className={`text-[10px] ${muted} mt-4`}>
        Ye sirf market ka overview hai, buy ya sell ki salah nahi.
      </p>
    </section>
  )
}
