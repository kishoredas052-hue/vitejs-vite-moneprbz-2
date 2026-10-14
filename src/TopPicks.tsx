import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Pick = {
  symbol: string
  price: number
  change_percent: number
  rsi: number
  ret20: number
  score: number
  verdict: string
  reasons: string[]
  pe: number | null
  roe: number | null
}

type Props = {
  card: string
  muted: string
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (s: Stock) => void
}

export default function TopPicks({ card, muted, t, watch, onToggle, onOpen }: Props) {
  const [picks, setPicks] = useState<Pick[] | null>(null)
  const [updated, setUpdated] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/top-picks`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d.picks)) {
          setPicks(d.picks)
          setUpdated(d.updated ?? '')
        } else {
          setFailed(true)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-4 mt-6">
      <h2 className={`text-sm ${muted} mb-1`}>{t.picks}</h2>
      <p className={`text-xs ${muted} mb-3`}>Analysis score ke hisaab se (RSI aur trend)</p>

      {!picks && !failed && (
        <div className={`rounded-xl ${card} p-4`}>
          <p className={`text-sm ${muted}`}>Picks load ho rahe hain...</p>
          <p className={`text-xs ${muted} mt-1`}>Pehli baar 1-2 minute lag sakte hain.</p>
        </div>
      )}

      {failed && (
        <div className={`rounded-xl ${card} p-4`}>
          <p className={`text-sm ${muted}`}>Picks abhi available nahi hain.</p>
        </div>
      )}

      {picks?.map((p) => {
        const up = p.change_percent >= 0
        const added = watch.includes(p.symbol)
        const vColor =
          p.verdict === 'Positive bias'
            ? 'text-green-400'
            : p.verdict === 'Weak bias'
            ? 'text-red-400'
            : muted
        return (
          <div
            key={p.symbol}
            onClick={() => onOpen({ name: p.symbol, exch: 'NSE', price: '', change: 0 })}
            className={`${card} rounded-xl p-4 mb-3 cursor-pointer`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{p.symbol}</p>
                <p className={`text-xs mt-1 ${vColor}`}>
                  {p.verdict} · Score {p.score}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {p.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className={up ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                  {up ? '+' : ''}
                  {p.change_percent.toFixed(2)}%
                </p>
              </div>
            </div>

            <ul className={`mt-3 text-xs ${muted} list-disc pl-4 space-y-1`}>
              {p.reasons.slice(0, 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            <div className="flex justify-between items-center mt-3">
              <p className={`text-xs ${muted}`}>
                RSI {p.rsi} · 1M {p.ret20 >= 0 ? '+' : ''}
                {p.ret20}%
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(p.symbol)
                }}
                className={`text-xs px-2 py-1 rounded-full ${
                  added ? 'bg-violet-600 text-white' : `border border-zinc-600 ${muted}`
                }`}
              >
                {added ? t.inWatch : t.addToWatch}
              </button>
            </div>
          </div>
        )
      })}

      {picks && (
        <p className={`text-[10px] ${muted} mt-1`}>
          Updated: {updated}. Ye sirf analysis signal hai, buy ya sell ki salah nahi.
        </p>
      )}
    </section>
  )
            }
