import { useState } from 'react'
import type { Settings, T, User, RiskLevel } from './data'

type Props = {
  t: T
  settings: Settings
  update: (patch: Partial<Settings>) => void
  user: User | null
  setUser: (user: User | null) => void
  card: string
  muted: string
}

const riskOptions: {
  value: RiskLevel
  label: string
  detail: string
}[] = [
  {
    value: 'conservative',
    label: 'Conservative',
    detail: 'Capital protection ko priority',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    detail: 'Risk aur growth ka balance',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    detail: 'Higher volatility tolerate kar sakte hain',
  },
]

export default function ProfileScreen({
  t,
  settings,
  update,
  user,
  setUser,
  card,
  muted,
}: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')

  const buttonClass = (active: boolean) =>
    `rounded-xl border px-3 py-3 text-sm font-medium transition ${
      active
        ? 'border-violet-500 bg-violet-600 text-white'
        : `border-white/10 ${muted}`
    }`

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500'

  function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanName = name.trim()
    const cleanEmail = email.trim()

    if (!cleanName) {
      setFormError('Apna naam enter karo.')
      return
    }

    if (cleanEmail && !cleanEmail.includes('@')) {
      setFormError('Email address check karo.')
      return
    }

    setUser({
      name: cleanName,
      email: cleanEmail,
    })

    setName('')
    setEmail('')
    setFormError('')
  }

  return (
    <section className="mx-4 mt-6 space-y-4 pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          StockSaathi
        </p>
        <h2 className="mt-2 text-2xl font-bold">{t.profile}</h2>
        <p className={`mt-1 text-sm ${muted}`}>
          Apna profile aur app preferences manage karo.
        </p>
      </header>

      <div className={`rounded-2xl border border-white/5 p-5 ${card}`}>
        <h3 className="mb-4 text-base font-bold">Account</h3>

        {user ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-xl font-bold text-violet-300">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="font-semibold">{user.name}</p>
                {user.email && (
                  <p className={`break-all text-sm ${muted}`}>
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUser(null)}
              className="mt-4 rounded-xl border border-rose-500/30 px-4 py-2 text-sm text-rose-400"
            >
              {t.signOut}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="name"
              maxLength={80}
              className={inputClass}
            />

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email (optional)"
              aria-label="Email address"
              autoComplete="email"
              maxLength={254}
              className={inputClass}
            />

            {formError && (
              <p role="alert" className="text-sm text-rose-400">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {t.signIn}
            </button>

            <p className={`text-xs leading-relaxed ${muted}`}>
              Ye sirf local profile hai. Isse online account ya cloud
              sync create nahi hota.
            </p>
          </form>
        )}
      </div>

      <div className={`space-y-5 rounded-2xl border border-white/5 p-5 ${card}`}>
        <h3 className="text-base font-bold">{t.settings}</h3>

        <div>
          <p className={`mb-3 text-sm font-medium ${muted}`}>
            Appearance
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={settings.dark}
              onClick={() => update({ dark: true })}
              className={buttonClass(settings.dark)}
            >
              🌙 Dark
            </button>

            <button
              type="button"
              aria-pressed={!settings.dark}
              onClick={() => update({ dark: false })}
              className={buttonClass(!settings.dark)}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        <div>
          <p className={`mb-3 text-sm font-medium ${muted}`}>
            {t.language}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={settings.lang === 'en'}
              onClick={() => update({ lang: 'en' })}
              className={buttonClass(settings.lang === 'en')}
            >
              English
            </button>

            <button
              type="button"
              aria-pressed={settings.lang === 'hi'}
              onClick={() => update({ lang: 'hi' })}
              className={buttonClass(settings.lang === 'hi')}
            >
              Hinglish
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">{t.notifications}</p>

          <button
            type="button"
            role="switch"
            aria-checked={settings.notif}
            onClick={() => update({ notif: !settings.notif })}
            className={`mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 p-3 text-sm ${
              settings.notif ? 'bg-violet-500/10' : ''
            }`}
          >
            <span>{settings.notif ? 'Enabled' : 'Disabled'}</span>
            <span
              className={`h-3 w-3 rounded-full ${
                settings.notif ? 'bg-violet-500' : 'bg-zinc-500'
              }`}
            />
          </button>

          <p className={`mt-2 text-xs ${muted}`}>
            Ye preference toggle hai, real push notification nahi.
          </p>
        </div>
      </div>

      <div className={`space-y-5 rounded-2xl border border-white/5 p-5 ${card}`}>
        <div>
          <h3 className="text-base font-bold">Investment preferences</h3>
          <p className={`mt-1 text-xs ${muted}`}>
            Ye preferences hain, personalised financial advice nahi.
          </p>
        </div>

        <div>
          <p className={`mb-3 text-sm font-medium ${muted}`}>
            {t.riskProfile}
          </p>

          <div className="space-y-2">
            {riskOptions.map((option) => {
              const active = settings.risk === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ risk: option.value })}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10'
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className={`mt-1 block text-xs ${muted}`}>
                    {option.detail}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="investment-goal"
            className={`mb-2 block text-sm font-medium ${muted}`}
          >
            {t.investmentGoal}
          </label>

          <textarea
            id="investment-goal"
            value={settings.goal}
            onChange={(event) => update({ goal: event.target.value })}
            placeholder="Long-term wealth creation, 5–10 years"
            maxLength={300}
            rows={3}
            className={`${inputClass} resize-y`}
          />

          <p className={`mt-1 text-right text-xs ${muted}`}>
            {settings.goal.length}/300
          </p>
        </div>
      </div>

      <div className={`rounded-2xl border border-white/5 p-4 ${card}`}>
        <p className="text-sm font-bold">StockSaathi</p>
        <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
          Market data aur screening tools informational purposes ke
          liye hain. Investing mein loss ka risk hota hai aur returns
          guaranteed nahi hain.
        </p>
      </div>
    </section>
  )
}
