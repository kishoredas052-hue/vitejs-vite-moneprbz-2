import { useEffect, useState } from 'react'
import type { Stock, T } from './data'
import { getPulse } from './pulseApi'

type Item = { symbol: string; price: number; change_percent: number }

type Props = {
  card: string
  muted: string
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (s: Stock) => void
}

export default function Movers({ card, muted, t, watch, onToggle, onOpen }: Props) {
  const [gainers, setGainers] = useState<Item[]>([])
  const [losers, setLosers] = useState<Item[]>([])

  useEffect(() => {
    let cancelled = false
    getPulse()
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d.gainers)) setGainers(d.gainers)
        if (Array.isArray(d.losers)) setLosers(d.losers)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (gainers.length === 0 && losers.length === 0) return null

  const row = (item: Item) => {
    const up = item.change_percent >= 0
    const added = watch.includes(item.symbol)
    return (
      <div
        key={item.symbol}
        onClick={() => onOpen({ name: item.symbol, exch: 'NSE', price: '', change: 0 })}
        className={`flex justify-between items-center ${card} rounded-xl p-4 mb-3 cursor-pointer`}
      >
        <div>
          <p className="font-semibold">{item.symbol}</p>
          <p className={`text-xs ${muted}`}>NSE</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">
            {item.price.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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

  return (
    <section className="mx-4 mt-6">
      <h2 className={`text-sm ${muted} mb-3`}>Market movers (aaj)</h2>

      <p className={`text-xs ${muted} mb-2`}>Top gainers</p>
      {gainers.map(row)}

      <p className={`text-xs ${muted} mb-2 mt-4`}>Top losers</p>
      {losers.map(row)}

      <p className={`text-[10px] ${muted} mt-2`}>
        Ye sirf aaj ki price move hai, analysis ya salah nahi.
      </p>
    </section>
  )
}
