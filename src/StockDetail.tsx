import { useEffect, useState } from 'react'
import type { Stock, Timeframe, T } from './data'
import { timeframes } from './data'
import LineChart from './LineChart'

const API = 'https://pro-investment-backend.onrender.com'

type Props = {
  stock: Stock
  card: string
  muted: string
  t: T
  added: boolean
  onToggle: (name: string) => void
  onBack: () => void
}

export default function StockDetail({ stock, card, muted, t, added, onToggle, onBack }: Props) {
  const [tf, setTf] = useState<Timeframe>('1M')
  const [points, setPoints] = useState<number[] | null>(null)
  const symbol = stock.exch === 'NSE' ? `${stock.name}.NS` : stock.name

  useEffect(() => {
    let cancelled = false
    setPoints(null)
    fetch(`${API}/history?symbol=${encodeURIComponent(symbol)}&tf=${tf}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.points) && d.points.length > 1) {
          setPoints(d.points)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [symbol, tf])

  const last = points ? points[points.length - 1] : null
  const first = points ? points[0] : null
  const changePct = last !== null && first ? ((last - first) / first) * 100 : null
  const prefix = stock.exch === 'NASDAQ' ? '$ ' : ''
  const priceText =
    last !== null
      ? prefix +
        last.toLocaleString(stock.exch === 'NSE' ? 'en-IN' : 'en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : stock.price

  return (
    <section className="mx-4 mt-6">
      <button onClick={onBack} className={`text-sm ${muted} mb-3`}>
        ← Back
      </button>

      <div className={`rounded-2xl ${card} p-5`}>
        <p className={`text-sm ${muted}`}>
          {stock.name} · {stock.exch}
        </p>
        <p className="text-3xl font-bold mt-1">{priceText}</p>
        {changePct !== null && (
          <p className={changePct >= 0 ? 'text-green-400 text-sm mt-1' : 'text-red-400 text-sm mt-1'}>
            {changePct >= 0 ? '+' : ''}
            {changePct.toFixed(2)}% ({tf})
          </p>
        )}

        {points ? (
          <LineChart data={points} />
        ) : (
          <p className={`text-sm ${muted} mt-6 h-24`}>Chart load ho raha hai...</p>
        )}

        <div className="flex justify-between mt-4 text-sm">
          {timeframes.map((x) => (
            <button
              key={x}
              onClick={() => setTf(x)}
              className={`px-3 py-1 rounded-full ${tf === x ? 'bg-violet-600 text-white' : muted}`}
            >
              {x}
            </button>
          ))}
        </div>

        <button
          onClick={() => onToggle(stock.name)}
          className={`mt-5 w-full rounded-lg py-2 text-sm ${
            added ? 'bg-violet-600 text-white' : `border border-zinc-600 ${muted}`
          }`}
        >
          {added ? t.inWatch : t.addToWatch}
        </button>
      </div>
    </section>
  )
}
