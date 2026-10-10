import { useEffect, useState } from 'react'
import type { Settings, Timeframe, Tab, User } from './data'
import { text, chartData, stocks, timeframes, navItems } from './data'
import LineChart from './LineChart'
import StockList from './StockList'
import ProfileScreen from './ProfileScreen'

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
  const [tf, setTf] = useState<Timeframe>('1M')
  const [settings, setSettings] = useState<Settings>(() =>
    load('pit-settings', defaultSettings)
  )
  const [user, setUser] = useState<User | null>(null)
  const [watch, setWatch] = useState<string[]>(() => load('pit-watch', []))

  useEffect(() => {
    try {
      localStorage.setItem('pit-settings', JSON.stringify(settings))
    } catch {}
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem('pit-watch', JSON.stringify(watch))
    } catch {}
  }, [watch])

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }))

  const toggleWatch = (name: string) =>
    setWatch((w) => (w.includes(name) ? w.filter((x) => x !== name) : [...w, name]))

  const t = text[settings.lang]
  const card = settings.dark ? 'bg-zinc-900' : 'bg-zinc-100'
  const muted = settings.dark ? 'text-zinc-400' : 'text-zinc-500'
  const base = settings.dark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
  const border = settings.dark ? 'border-zinc-800' : 'border-zinc-200'

  const watched = stocks.filter((s) => watch.includes(s.name))

  return (
    <div className={`min-h-screen ${base} max-w-md mx-auto pb-24`}>
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-lg font-semibold">{t.appName}</h1>
        <span className={`text-xs ${muted}`}>{t.analysisOnly}</span>
      </header>

      {tab === 'Home' && (
        <>
          <section className={`mx-4 mt-5 rounded-2xl ${card} p-5`}>
            <p className={`text-sm ${muted}`}>{t.nifty}</p>
            <p className="text-3xl font-bold mt-1">22,450.80</p>
            <p className="text-green-400 text-sm mt-1">+186.25 (+0.84%)</p>

            <LineChart data={chartData[tf]} />

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
          </section>

          <section className="mx-4 mt-6">
            <h2 className={`text-sm ${muted} mb-3`}>{t.picks}</h2>
            <StockList items={stocks} card={card} muted={muted} t={t} watch={watch} onToggle={toggleWatch} />
          </section>
        </>
      )}

      {tab === 'Stocks' && (
        <section className="mx-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">{t.stocks}</h2>
          <StockList items={stocks} card={card} muted={muted} t={t} watch={watch} onToggle={toggleWatch} />
        </section>
      )}

      {tab === 'Watchlist' && (
        <section className="mx-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">{t.watchlist}</h2>
          {watched.length === 0 ? (
            <p className={`text-sm ${muted} mt-2`}>{t.watchEmpty}</p>
          ) : (
            <StockList items={watched} card={card} muted={muted} t={t} watch={watch} onToggle={toggleWatch} />
          )}
        </section>
      )}

      {tab === 'Profile' && (
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
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md ${card} border-t ${border} flex justify-around py-3 text-xs`}
      >
        {navItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => setTab(item.tab)}
            className={tab === item.tab ? 'text-violet-400' : muted}
          >
            {item.icon} {t[item.key]}
          </button>
        ))}
      </nav>
    </div>
  )
}
