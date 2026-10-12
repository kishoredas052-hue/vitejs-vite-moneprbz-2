import { useEffect, useState } from 'react'
import type { Stock, Timeframe, T } from './data'
import { timeframes } from './data'
import LineChart from './LineChart'

const API = 'https://pro-investment-backend.onrender.com'

type An = {
  price: number
  sma20: number | null
  sma50: number | null
  rsi: number | null
  high52: number | null
  low52: number | null
  pe: number | null
  roe: number | null
  verdict: string
  reasons?: string[]
}

type Props = {
  stock: Stock
  card: string
  muted: string
  t: T
  added: boolean
  onToggle: (name: string) => void
  onBack: () => void
}

const f = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined ? '-' : v.toFixed(d)

export default function StockDetail({ stock, card, muted, t, added, onToggle, onBack }: Props) {
  const [tf, setTf] = useState<Timeframe>('1M')
  const [points, setPoints] = useState<number[] | null>(null)
  const [an, setAn] = useState<An | null>(null)
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

  useEffect(() => {
    let cancelled = false
    setAn(null)
    fetch(`${API}/analysis?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d.price === 'number') setAn(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [symbol])

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

  const vColor =
    an?.verdict === 'Positive bias'
      ? 'text-green-400'
      : an?.verdict === 'Weak bias'
      ? 'text-red-400'
      : muted

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

      {an && (
        <div className={`rounded-2xl ${card} p-5 mt-4`}>
          <p className="font-semibold">Analysis</p>
          <p className={`text-sm mt-1 ${vColor}`}>{an.verdict}</p>

          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            <div>
              <p className={`text-xs ${muted}`}>RSI (14)</p>
              <p>{f(an.rsi, 1)}</p>
            </div>
            <div>
              <p className={`text-xs ${muted}`}>SMA 20 / 50</p>
              <p>
                {f(an.sma20, 0)} / {f(an.sma50, 0)}
              </p>
            </div>
            <div>
              <p className={`text-xs ${muted}`}>52W High / Low</p>
              <p>
                {f(an.high52, 0)} / {f(an.low52, 0)}
              </p>
            </div>
            <div>
              <p className={`text-xs ${muted}`}>PE / ROE %</p>
              <p>
                {f(an.pe, 1)} / {f(an.roe, 1)}
              </p>
            </div>
          </div>

          <ul className={`mt-3 text-xs ${muted} list-disc pl-4 space-y-1`}>
            {(an.reasons ?? []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <p className={`text-[10px] ${muted} mt-3`}>
            Ye sirf analysis signal hai, buy ya sell ki salah nahi.
          </p>
        </div>
      )}
    </section>
  )
}
