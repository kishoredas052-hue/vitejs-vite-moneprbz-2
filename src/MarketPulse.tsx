import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

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
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (s: Stock) => void
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

type RowProps = {
  item: Item
  card: string
  muted: string
  t: T
  added: boolean
  onOpen: (symbol: string) => void
  onToggle: (symbol: string) => void
}

function PickRow({ item, card, muted, t, added, onOpen, onToggle }: RowProps) {
  const up = item.change_percent >= 0
  return (
    <div
      onClick={() => onOpen(item.symbol)}
      className={`flex justify-between items-center ${card} rounded-xl p-4 mb-3 cursor-pointer`}
    >
      <div>
        <p className="font-semibold">{item.symbol}</p>
        <p className={`text-xs ${muted}`}>NSE</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">
          {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={up ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
          {up ? '+' : ''}
          {item.change_percent.toFixed(2)}%
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(item.symbol)
          }}
          className={`mt-2 text-xs px-2 py-1 rounded-full ${
            added ? 'bg-violet-600 text-white' : `border border-zinc-600 ${muted}`
          }`}
        >
          {added ? t.inWatch : t.addToWatch}
        </button>
      </div>
    </div>
  )
}

export default function MarketPulse({ card, muted, t, watch, onToggle, onOpen }: Props) {
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
  const openPick = (symbol: string) => onOpen({ name: symbol, exch: 'NSE', price: '', change: 0 })

  return (
    <>
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
            <div className="h-2 bg-violet-500" style={{ width: `${Math.min(100, data.breadth.percent)}%` }} />
          </div>
          <p className={`text-xs ${muted} mt-1`}>{data.breadth.percent}%</p>
        </div>

        <p className={`text-[10px] ${muted} mt-3`}>Updated: {data.updated}</p>
      </section>

      <section className="mx-4 mt-6">
        <h2 className={`text-sm ${muted} mb-3`}>{t.picks}</h2>

        <p className={`text-xs ${muted} mb-2`}>Top gainers</p>
        {data.gainers.map((g) => (
          <PickRow
            key={g.symbol}
            item={g}
            card={card}
            muted={muted}
            t={t}
            added={watch.includes(g.symbol)}
            onOpen={openPick}
            onToggle={onToggle}
          />
        ))}

        <p className={`text-xs ${muted} mb-2 mt-4`}>Top losers</p>
        {data.losers.map((l) => (
          <PickRow
            key={l.symbol}
            item={l}
            card={card}
            muted={muted}
            t={t}
            added={watch.includes(l.symbol)}
            onOpen={openPick}
            onToggle={onToggle}
          />
        ))}

        <p className={`text-[10px] ${muted} mt-2`}>
          Ye sirf market ka overview hai, buy ya sell ki salah nahi.
        </p>
      </section>
    </>
  )
         }
