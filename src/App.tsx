import { useState } from 'react'
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
    load('pit-settings', defaultSettings)
  )
  const [user, setUser] = useState<User | null>(null)
  const [watch, setWatch] = useState<string[]>(() => load('pit-watch', []))

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }))

  const toggleWatch = (name: string) =>
    setWatch((w) => (w.includes(name) ? w.filter((x) => x !== name) : [...w, name]))

  const t = text[settings.lang]
  const card = settings.dark ? 'bg-zinc-900' : 'bg-zinc-100'
  const muted = settings.dark ? 'text-zinc-400' : 'text-zinc-500'
  const base = settings.dark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
  const border = settings.dark ? 'border-zinc-800' : 'border-zinc-200'

  const watched: Stock[] = watch.map(
    (name) => stocks.find((s) => s.name === name) ?? { name, exch: 'NSE', price: '', change: 0 }
  )

  return (
    <div className={`min-h-screen ${base} max-w-md mx-auto pb-24`}>
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-lg font-semibold">{t.appName}</h1>
        <span className={`text-xs ${muted}`}>{t.analysisOnly}</span>
      </header>

      {!selected && tab === 'Home' && (
        <>
          <section className="mx-4 mt-5">
            <Screener card={card} muted={muted} t={t} onOpen={setSelected} searchOnly />
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
            <h2 className="text-lg font-semibold mb-3">{t.stocks}</h2>
            <StockList
              items={stocks}
              card={card}
              muted={muted}
              t={t}
              watch={watch}
              onToggle={toggleWatch}
              onOpen={setSelected}
            />
          </section>
          <Screener card={card} muted={muted} t={t} onOpen={setSelected} />
        </>
      )}

      {!selected && tab === 'Watchlist' && (
        <section className="mx-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">{t.watchlist}</h2>
          {watched.length > 0 && <Alerts card={card} muted={muted} items={watched} />}
          {watched.length === 0 ? (
            <p className={`text-sm ${muted} mt-2`}>{t.watchEmpty}</p>
          ) : (
            <StockList
              items={watched}
              card={card}
              muted={muted}
              t={t}
              watch={watch}
              onToggle={toggleWatch}
              onOpen={setSelected}
            />
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
            onClick={() => {
              setTab(item.tab)
              setSelected(null)
            }}
            className={tab === item.tab ? 'text-violet-400' : muted}
          >
            {item.icon} {t[item.key]}
          </button>
        ))}
      </nav>
    </div>
  )
}
