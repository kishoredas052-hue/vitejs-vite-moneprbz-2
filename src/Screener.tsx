import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Result = {
  symbol: string
  price: number
  rsi: number | null
  pe: number | null
  score: number
  verdict: string
  reasons?: string[]
}

type Sug = { name: string; symbol: string }

type Props = {
  card: string
  muted: string
  t: T
  onOpen: (s: Stock) => void
}

const RSI_OPTIONS = [30, 40, 50, 70]
const PE_OPTIONS = [25, 40, 1000]
const TREND_OPTIONS: { value: string; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'up', label: 'Uptrend' },
  { value: 'down', label: 'Downtrend' },
]

function toStock(sym: string): Stock {
  const name = sym.replace('.NS', '')
  return { name, exch: 'NSE', price: '', change: 0 }
}

export default function Screener({ card, muted, onOpen }: Props) {
  const [q, setQ] = useState('')
  const [sugs, setSugs] = useState<Sug[]>([])
  const [mkt, setMkt] = useState<'NSE' | 'US'>('NSE')
  const [maxRsi, setMaxRsi] = useState(40)
  const [maxPe, setMaxPe] = useState(1000)
  const [trend, setTrend] = useState('any')
  const [results, setResults] = useState<Result[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = q.trim()
    if (mkt !== 'NSE' || term.length < 2) {
      setSugs([])
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      fetch(`${API}/symbols?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setSugs(Array.isArray(d.items) ? d.items : [])
        })
        .catch(() => {
          if (!cancelled) setSugs([])
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q, mkt])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setResults(null)
    fetch(`${API}/screener?max_rsi=${maxRsi}&max_pe=${maxPe}&trend=${trend}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setResults(Array.isArray(d.results) ? d.results : [])
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [maxRsi, maxPe, trend])

  const openSymbol = (sym: string) => {
    const clean = sym.trim().toUpperCase().replace(/\.NS$/, '')
    if (!clean) return
    onOpen({
      name: clean,
      exch: mkt === 'NSE' ? 'NSE' : 'NASDAQ',
      price: '',
      change: 0,
    })
    setQ('')
    setSugs([])
  }

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs ${active ? 'bg-violet-600 text-white' : `border border-zinc-600 ${muted}`}`

  return (
    <section className="mx-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Search</h2>

      <div className={`rounded-2xl ${card} p-4 space-y-3`}>
        <div className="flex gap-2">
          <button className={chip(mkt === 'NSE')} onClick={() => setMkt('NSE')}>
            NSE
          </button>
          <button className={chip(mkt === 'US')} onClick={() => setMkt('US')}>
            US
          </button>
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openSymbol(q)
              }}
              placeholder={mkt === 'NSE' ? 'Company ya symbol, jaise Ambuja' : 'Jaise NVDA, AAPL'}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={() => openSymbol(q)}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
            >
              Kholo
            </button>
          </div>

          {sugs.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-lg bg-zinc-800 border border-zinc-700 z-10 max-h-64 overflow-y-auto">
              {sugs.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => openSymbol(s.symbol)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700"
                >
                  <span className="font-semibold">{s.symbol}</span>
                  <span className={`ml-2 text-xs ${muted}`}>{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className={`text-xs ${muted}`}>
          Company ka naam likhein (jaise Ambuja), dropdown se chunein. Ya symbol seedha likh kar Kholo dabayein.
        </p>
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-3">Screener</h2>

      <div className={`rounded-2xl ${card} p-4 space-y-3`}>
        <div>
          <p className={`text-xs ${muted} mb-2`}>RSI max</p>
          <div className="flex gap-2 flex-wrap">
            {RSI_OPTIONS.map((v) => (
              <button key={v} className={chip(maxRsi === v)} onClick={() => setMaxRsi(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={`text-xs ${muted} mb-2`}>PE max</p>
          <div className="flex gap-2 flex-wrap">
            {PE_OPTIONS.map((v) => (
              <button key={v} className={chip(maxPe === v)} onClick={() => setMaxPe(v)}>
                {v === 1000 ? 'Any' : v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={`text-xs ${muted} mb-2`}>Trend</p>
          <div className="flex gap-2 flex-wrap">
            {TREND_OPTIONS.map((o) => (
              <button key={o.value} className={chip(trend === o.value)} onClick={() => setTrend(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loading && <p className={`text-sm ${muted}`}>Screener chal raha hai... (pehli baar 30-60 second)</p>}
        {!loading && results && results.length === 0 && (
          <p className={`text-sm ${muted}`}>Is filter mein koi stock nahi mila.</p>
        )}
        {results &&
          results.map((r) => (
            <div
              key={r.symbol}
              onClick={() => onOpen(toStock(r.symbol))}
              className={`flex justify-between items-center ${card} rounded-xl p-4 mb-3 cursor-pointer`}
            >
              <div>
                <p className="font-semibold">{r.symbol.replace('.NS', '')}</p>
                <p className={`text-xs ${muted}`}>
                  RSI {r.rsi?.toFixed(1) ?? '-'} · PE {r.pe?.toFixed(1) ?? '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{r.price.toLocaleString('en-IN')}</p>
                <p className={`text-xs ${r.score >= 1 ? 'text-green-400' : r.score < 0 ? 'text-red-400' : muted}`}>
                  {r.verdict}
                </p>
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}
