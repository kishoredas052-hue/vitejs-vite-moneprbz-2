import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Live = { price: number; change_percent: number }

function useLivePrice(s: Stock): Live | null {
  const [live, setLive] = useState<Live | null>(null)

  useEffect(() => {
    let cancelled = false
    const symbol = s.exch === 'NSE' ? `${s.name}.NS` : s.name
    fetch(`${API}/price/${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d.price === 'number') {
          setLive({ price: d.price, change_percent: d.change_percent })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [s.name, s.exch])

  return live
}

type RowProps = {
  s: Stock
  card: string
  muted: string
  t: T
  added: boolean
  onToggle: (name: string) => void
  onOpen: (s: Stock) => void
}

function StockRow({ s, card, muted, t, added, onToggle, onOpen }: RowProps) {
  const live = useLivePrice(s)

  const prefix = s.exch === 'NASDAQ' ? '$ ' : ''
  const price = live
    ? prefix +
      live.price.toLocaleString(s.exch === 'NSE' ? 'en-IN' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : s.price
  const change = live ? live.change_percent : s.change

  return (
    <div
      onClick={() => onOpen(s)}
      className={`flex justify-between items-center ${card} rounded-xl p-4 mb-3 cursor-pointer`}
    >
      <div>
        <p className="font-semibold">{s.name}</p>
        <p className={`text-xs ${muted}`}>{s.exch}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{price}</p>
        <p className={change >= 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(s.name)
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

type Props = {
  items: Stock[]
  card: string
  muted: string
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (s: Stock) => void
}

export default function StockList({ items, card, muted, t, watch, onToggle, onOpen }: Props) {
  return (
    <>
      {items.map((s) => (
        <StockRow
          key={s.name}
          s={s}
          card={card}
          muted={muted}
          t={t}
          added={watch.includes(s.name)}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}
    </>
  )
}
