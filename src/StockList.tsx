
import { useEffect, useState } from 'react'
import type { Stock, T } from './data'

const API = 'https://pro-investment-backend.onrender.com'

type Live = {
  price: number
  change_percent: number
}

function useLivePrice(stock: Stock): Live | null {
  const [live, setLive] = useState<Live | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const symbol =
      stock.exch === 'NSE' ? `${stock.name}.NS` : stock.name

    async function fetchPrice() {
      try {
        const response = await fetch(
          `${API}/price/${encodeURIComponent(symbol)}`,
          { signal: controller.signal },
        )

        if (!response.ok) return

        const data = await response.json()

        if (typeof data.price === 'number') {
          setLive({
            price: data.price,
            change_percent:
              typeof data.change_percent === 'number'
                ? data.change_percent
                : 0,
          })
        }
      } catch {
        // Keep the fallback price when live data is unavailable.
      }
    }

    void fetchPrice()

    return () => controller.abort()
  }, [stock.name, stock.exch])

  return live
}

type RowProps = {
  s: Stock
  card: string
  muted: string
  t: T
  added: boolean
  onToggle: (name: string) => void
  onOpen: (stock: Stock) => void
}

function StockRow({
  s,
  card,
  muted,
  t,
  added,
  onToggle,
  onOpen,
}: RowProps) {
  const live = useLivePrice(s)
  const isUS = s.exch === 'NASDAQ' || s.exch === 'NYSE'

  const priceValue = live?.price
  const price =
    priceValue != null
      ? `${isUS ? '$' : '₹'}${priceValue.toLocaleString(
          isUS ? 'en-US' : 'en-IN',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`
      : s.price && s.price !== '—'
        ? `${isUS ? '$' : '₹'}${s.price}`
        : '—'

  const change = live?.change_percent ?? s.change
  const positive = change >= 0

  return (
    <article
      onClick={() => onOpen(s)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(s)
        }
      }}
      role="button"
      tabIndex={0}
      className={`${card} mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/5 p-4 transition hover:border-violet-500/40 active:scale-[0.99]`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{s.name}</span>
          {added && (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-400">
              WATCHING
            </span>
          )}
        </div>
        <p className={`mt-1 text-xs ${muted}`}>{s.exch}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold tabular-nums">{price}</p>

        <p
          className={`mt-1 text-sm font-medium tabular-nums ${
            positive ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {positive ? '+' : ''}
          {change.toFixed(2)}%
        </p>

        <button
          type="button"
          aria-label={
            added
              ? `Remove ${s.name} from watchlist`
              : `Add ${s.name} to watchlist`
          }
          onClick={(event) => {
            event.stopPropagation()
            onToggle(s.name)
          }}
          className={`mt-2 min-h-9 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
            added
              ? 'bg-violet-600 text-white hover:bg-violet-500'
              : 'border border-zinc-600 text-zinc-300 hover:border-violet-500 hover:text-violet-300'
          }`}
        >
          {added ? t.inWatch : t.addToWatch}
        </button>
      </div>
    </article>
  )
}

type Props = {
  items: Stock[]
  card: string
  muted: string
  t: T
  watch: string[]
  onToggle: (name: string) => void
  onOpen: (stock: Stock) => void
}

export default function StockList({
  items,
  card,
  muted,
  t,
  watch,
  onToggle,
  onOpen,
}: Props) {
  if (items.length === 0) {
    return (
      <div className={`${card} rounded-2xl border border-white/5 p-6 text-center`}>
        <p className="text-2xl">⌕</p>
        <p className="mt-2 font-medium">No stocks to display</p>
        <p className={`mt-1 text-sm ${muted}`}>
          Try again when market data is available.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.map((stock) => (
        <StockRow
          key={`${stock.exch}-${stock.name}`}
          s={stock}
          card={card}
          muted={muted}
          t={t}
          added={watch.includes(stock.name)}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
      }
  
