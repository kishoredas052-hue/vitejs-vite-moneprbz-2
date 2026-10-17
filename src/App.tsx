
import { useEffect, useState } from 'react'
import type { Settings, Tab, User, Stock } from './data'
import { text, stocks, navItems } from './data'
import StockList from './StockList'
import StockDetail from './StockDetail'
import ProfileScreen from './ProfileScreen'
import Screener from './Screener'
import MarketPulse from './MarketPulse'
import TopPicks from './TopPicks'
import Movers from './Movers'
import Alerts from './Alerts'

const API = 'https://pro-investment-backend.onrender.com'

const defaultSettings: Settings = {
  dark: true,
  lang: 'en',
  notif: true,
  risk: 'moderate',
  goal: '',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Home')
  const [selected, setSelected] = useState<Stock | null>(null)

  const [settings, setSettings] = useState<Settings>(() =>
    load('pit-settings', defaultSettings),
  )

  const [user, setUser] = useState<User | null>(() =>
    load<User | null>('pit-user', null),
  )

  const [watch, setWatch] = useState<string[]>(() =>
    load<string[]>('pit-watch', []),
  )

  const [etfs, setEtfs] = useState<Stock[]>([])
  const [etfLoading, setEtfLoading] = useState(false)
  const [etfError, setEtfError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('pit-settings', JSON.stringify(settings))
    } catch {
      // Browser storage may be unavailable.
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem('pit-watch', JSON.stringify(watch))
    } catch {
      // Browser storage may be unavailable.
    }
  }, [watch])

  useEffect(() => {
    try {
      localStorage.setItem('pit-user', JSON.stringify(user))
    } catch {
      // Browser storage may be unavailable.
    }
  }, [user])

  useEffect(() => {
    if (tab !== 'Stocks') return

    const controller = new AbortController()

    async function fetchEtfs() {
      setEtfLoading(true)
      setEtfError('')

      try {
        const response = await fetch(`${API}/etfs`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data: {
          results?: {
            symbol: string
            price?: number | string
            change_percent?: number
          }[]
        } = await response.json()

        const results = Array.isArray(data.results) ? data.results : []

        setEtfs(
          results.map((item) => ({
            name: item.symbol,
            exch: 'NSE',
            price:
              item.price != null
                ? Number(item.price).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })
                : '—',
            change: Number(item.change_percent ?? 0),
          })),
        )

        if (results.length === 0) {
          setEtfError('No ETF data received from the server.')
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return

        setEtfError(
          'ETF data is temporarily unavailable. Please try again later.',
        )
      } finally {
        if (!controller.signal.aborted) setEtfLoading(false)
      }
    }

    void fetchEtfs()

    return () => controller.abort()
  }, [tab])

  const update = (patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }

  const toggleWatch = (name: string) => {
    setWatch((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    )
  }

  const t = text[settings.lang]
  const card = settings.dark ? 'bg-zinc-900' : 'bg-zinc-100'
  const muted = settings.dark ? 'text-zinc-400' : 'text-zinc-500'
  const base = settings.dark
    ? 'bg-zinc-950 text-white'
    : 'bg-white text-zinc-900'
  const border = settings.dark ? 'border-zinc-800' : 'border-zinc-200'

  const watched: Stock[] = watch.map(
    (name) =>
      stocks.find((stock) => stock.name === name) ?? {
        name,
        exch: 'NSE',
        price: '—',
        change: 0,
      },
  )

  return (
    <div
      className={`min-h-screen ${base} max-w-md mx-auto pb-24 transition-colors duration-200`}
    >
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {t.appName}
          </h1>
          <p className={`text-[11px] mt-1 ${muted}`}>
            Market research dashboard
          </p>
        </div>

        <span
          className={`text-[10px] text-right max-w-32 ${muted}`}
        >
          {t.analysisOnly}
        </span>
      </header>

      {!selected && tab === 'Home' && (
        <>
          <section className="mx-4 mt-5">
            <Screener
              card={card}
              muted={muted}
              t={t}
              onOpen={setSelected}
              searchOnly
            />
          </section>

          <MarketPulse card={card} muted={muted} />

          <TopPicks
            card={card}
            muted={muted}
            t={t}
            watch={watch}
            onToggle={toggleWatch}
            onOpen={setSelected}
          />

          <Movers
            card={card}
            muted={muted}
            t={t}
            watch={watch}
            onToggle={toggleWatch}
            onOpen={setSelected}
          />
        </>
      )}

      {!selected && tab === 'Stocks' && (
        <>
          <section className="mx-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                ETFs & Market Screen
              </h2>
              {etfLoading && (
                <span className={`text-xs ${muted}`}>Loading…</span>
              )}
            </div>

            {etfError && (
              <div
                className={`${card} rounded-xl p-3 mb-3 text-sm ${muted}`}
                role="status"
              >
                {etfError}
              </div>
            )}

            {etfs.length > 0 && (
              <StockList
                items={etfs}
                card={card}
                muted={muted}
                t={t}
                watch={watch}
                onToggle={toggleWatch}
                onOpen={setSelected}
              />
            )}

            {!etfLoading && etfs.length === 0 && !etfError && (
              <p className={`text-sm ${muted}`}>
                No ETF data available yet.
              </p>
            )}
          </section>

          <Screener
            card={card}
            muted={muted}
            t={t}
            onOpen={setSelected}
          />
        </>
      )}

      {!selected && tab === 'Watchlist' && (
        <section className="mx-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">
            {t.watchlist}
          </h2>

          {watched.length > 0 ? (
            <>
              <Alerts card={card} muted={muted} items={watched} />

              <StockList
                items={watched}
                card={card}
                muted={muted}
                t={t}
                watch={watch}
                onToggle={toggleWatch}
                onOpen={setSelected}
              />
            </>
          ) : (
            <div className={`${card} rounded-2xl p-6 mt-3`}>
              <p className="text-2xl mb-2">☆</p>
              <p className="font-semibold">{t.watchlist}</p>
              <p className={`text-sm mt-2 ${muted}`}>
                {t.watchEmpty}
              </p>
              <button
                onClick={() => setTab('Stocks')}
                className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Explore markets
              </button>
            </div>
          )}
        </section>
      )}

      {selected && (
        <StockDetail
          stock={selected}
          card={card}
          muted={muted}
          t={t}
          added={watch.includes(selected.name)}
          onToggle={toggleWatch}
          onBack={() => setSelected(null)}
        />
      )}

      {tab === 'Profile' && !selected && (
        <ProfileScreen
          t={t}
          settings={settings}
          update={update}
          user={user}
          setUser={setUser}
          card={card}
          muted={muted}
        />
      )}

      <nav
        aria-label="Main navigation"
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md ${card} border-t ${border} flex justify-around py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}
      >
        {navItems.map((item) => (
          <button
            key={item.tab}
            type="button"
            aria-current={tab === item.tab ? 'page' : undefined}
            onClick={() => {
              setTab(item.tab)
              setSelected(null)
            }}
            className={`flex flex-col items-center gap-1 min-w-16 px-2 py-1 rounded-xl transition-colors ${
              tab === item.tab
                ? 'text-violet-400 font-semibold'
                : muted
            }`}
          >
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
            <span>{t[item.key]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
