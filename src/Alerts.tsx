import { useEffect, useState } from 'react'
import type { Stock } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Rules = { lo: number; hi: number; trend: boolean }
type Row = { name: string; rsi: number | null; above: boolean | null; flipped: boolean }
type Alert = { name: string; text: string; color: string }

type Props = {
  card: string
  muted: string
  items: Stock[]
}

const DEFAULT_RULES: Rules = { lo: 30, hi: 70, trend: true }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export default function Alerts({ card, muted, items }: Props) {
  const [rules, setRules] = useState<Rules>(() => read('pit-alert-rules', DEFAULT_RULES))
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const key = items.map((s) => s.name).join(',')

  useEffect(() => {
    let cancelled = false
    const list = items.slice(0, 10)
    if (list.length === 0) {
      setRows([])
      return
    }
    setLoading(true)
    const states = read<Record<string, string>>('pit-alert-state', {})

    Promise.all(
      list.map((s) => {
        const symbol = s.exch === 'NSE' ? `${s.name}.NS` : s.name
        return fetch(`${API}/analysis?symbol=${encodeURIComponent(symbol)}`)
          .then((r) => r.json())
          .then((d) => ({ s, d }))
          .catch(() => ({ s, d: null }))
      })
    ).then((results) => {
      if (cancelled) return
      const next = { ...states }
      const out: Row[] = []
      for (const { s, d } of results) {
        if (!d || typeof d.price !== 'number') continue
        const rsi = typeof d.rsi === 'number' ? d.rsi : null
        let above: boolean | null = null
        let flipped = false
        if (typeof d.sma50 === 'number') {
          above = d.price > d.sma50
          const now = above ? 'up' : 'down'
          const prev = states[s.name]
          flipped = !!prev && prev !== now
          next[s.name] = now
        }
        out.push({ name: s.name, rsi, above, flipped })
      }
      write('pit-alert-state', next)
      setRows(out)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [key])

  const save = (patch: Partial<Rules>) => {
    const next = { ...rules, ...patch }
    setRules(next)
    write('pit-alert-rules', next)
  }

  const alerts: Alert[] = []
  for (const r of rows) {
    if (r.rsi !== null) {
      if (r.rsi <= rules.lo) {
        alerts.push({
          name: r.name,
          text: `RSI ${r.rsi.toFixed(1)}: oversold zone (${rules.lo} ya neeche)`,
          color: 'text-green-400',
        })
      } else if (r.rsi >= rules.hi) {
        alerts.push({
          name: r.name,
          text: `RSI ${r.rsi.toFixed(1)}: overbought zone (${rules.hi} ya upar)`,
          color: 'text-yellow-300',
        })
      }
    }
    if (rules.trend && r.flipped && r.above !== null) {
      alerts.push({
        name: r.name,
        text: r.above
          ? 'Price 50-din average ke upar aa gaya'
          : 'Price 50-din average ke neeche aa gaya',
        color: r.above ? 'text-green-400' : 'text-red-400',
      })
    }
  }

  return (
    <div className={`rounded-2xl ${card} p-5 mb-4`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">Alerts</p>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs px-3 py-1 rounded-full border border-zinc-600"
        >
          {open ? 'Band karein' : 'Rules'}
        </button>
      </div>

      {open && (
        <div className="mt-3 text-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className={muted}>RSI is se neeche</span>
            <input
              type="number"
              value={rules.lo}
              onChange={(e) => save({ lo: Number(e.target.value) })}
              className="w-16 rounded-lg bg-zinc-700/40 px-2 py-1 text-center"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={muted}>RSI is se upar</span>
            <input
              type="number"
              value={rules.hi}
              onChange={(e) => save({ hi: Number(e.target.value) })}
              className="w-16 rounded-lg bg-zinc-700/40 px-2 py-1 text-center"
            />
          </div>
          <label className="flex items-center justify-between">
            <span className={muted}>Trend badlav batao</span>
            <input
              type="checkbox"
              checked={rules.trend}
              onChange={(e) => save({ trend: e.target.checked })}
            />
          </label>
        </div>
      )}

      <div className="mt-3">
        {loading && <p className={`text-xs ${muted}`}>Check ho raha hai...</p>}
        {!loading && alerts.length === 0 && (
          <p className={`text-xs ${muted}`}>Abhi koi alert nahi hai.</p>
        )}
        {alerts.map((a, i) => (
          <p key={i} className="text-sm mt-2">
            <span className="font-semibold">{a.name}</span>{' '}
            <span className={a.color}>{a.text}</span>
          </p>
        ))}
      </div>

      <p className={`text-[10px] ${muted} mt-3`}>
        Ye sirf analysis signal hai, buy ya sell ki salah nahi. Alerts tab check hote hain jab aap app kholte hain.
      </p>
    </div>
  )
            }
