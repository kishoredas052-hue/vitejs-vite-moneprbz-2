           
import { useState } from 'react';
import type { Settings, T, User, RiskLevel } from './data';

type Props = {
  t: T;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  card: string;
  muted: string;
};

const riskOptions: {
  value: RiskLevel;
  label: string;
  detail: string;
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
];

export default function ProfileScreen({
  t,
  settings,
  update,
  user,
  setUser,
  card,
  muted,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  const buttonClass = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition ${
      active
        ? 'border-violet-500 bg-violet-600 text-white'
        : `border-white/10 ${muted} hover:border-violet-400/50`
    }`;

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500';

  const sectionTitle = 'text-base font-bold tracking-tight';

  function signIn() {
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setFormError('Apna naam enter karo.');
      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setFormError('Email address check karo.');
      return;
    }

    setUser({ name: cleanName, email: cleanEmail });
    setFormError('');
    setName('');
    setEmail('');
  }

  return (
    <section className="mx-4 mt-6 space-y-4 pb-6">
      <header className="mb-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
          Your workspace
        </p>
        <h2 className="text-2xl font-bold">{t.profile}</h2>
        <p className={`mt-1 text-sm ${muted}`}>
          Account aur app preferences manage karo.
        </p>
      </header>

      <div className={`rounded-2xl ${card} border border-white/5 p-5`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-xl font-bold text-violet-300">
            {user?.name?.charAt(0).toUpperCase() || '👤'}
          </div>
          <div>
            <h3 className={sectionTitle}>{t.account}</h3>
            <p className={`mt-1 text-xs ${muted}`}>
              Local profile on this device
            </p>
          </div>
        </div>

        {user ? (
          <div className="rounded-xl border border-white/5 p-4">
            <p className="text-sm">
              {t.welcome},{' '}
              <span className="font-semibold text-violet-300">
                {user.name}
              </span>
            </p>

            {user.email && (
              <p className={`mt-1 break-all text-sm ${muted}`}>
                {user.email}
              </p>
            )}

            <button
              type="button"
              onClick={() => setUser(null)}
              className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400"
            >
              {t.logout}
            </button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              signIn();
            }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.name}
              aria-label="Your name"
              autoComplete="name"
              maxLength={80}
              className={inputClass}
            />

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={`${t.email} (optional)`}
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
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500"
            >
              {t.login}
            </button>

            <p className={`text-xs leading-relaxed ${muted}`}>
              Ye local profile hai. Isse online account ya cloud sync
              create nahi hota.
            </p>
          </form>
        )}
      </div>

      <div className={`space-y-5 rounded-2xl ${card} border border-white/5 p-5`}>
        <div>
          <h3 className={sectionTitle}>{t.settings}</h3>
          <p className={`mt-1 text-xs ${muted}`}>
            App ko apni preference ke hisaab se set karo.
          </p>
        </div>

        <div>
          <p className={`mb-3 text-sm font-semibold ${muted}`}>
            {t.theme}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={settings.dark}
              className={buttonClass(settings.dark)}
              onClick={() => update({ dark: true })}
            >
              🌙 {t.dark}
            </button>
            <button
              type="button"
              aria-pressed={!settings.dark}
              className={buttonClass(!settings.dark)}
              onClick={() => update({ dark: false })}
            >
              ☀️ {t.light}
            </button>
          </div>
        </div>

        <div>
          <p className={`mb-3 text-sm font-semibold ${muted}`}>
            {t.language}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={settings.lang === 'en'}
              className={buttonClass(settings.lang === 'en')}
              onClick={() => update({ lang: 'en' })}
            >
              English
            </button>
            <button
              type="button"
              aria-pressed={settings.lang === 'hi'}
              className={buttonClass(settings.lang === 'hi')}
              onClick={() => update({ lang: 'hi' })}
            >
              हिंदी / Hinglish
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">{t.notifications}</p>
          <button
            type="button"
            role="switch"
            aria-checked={settings.notif}
            onClick={() => update({ notif: !settings.notif })}
            className={`mt-3 flex w-full items-center justify-between rounded-xl border border-white/5 p-3 text-sm ${
              settings.notif ? 'bg-violet-500/10' : 'bg-white/[0.02]'
            }`}
          >
            <span>{settings.notif ? t.on : t.off}</span>
            <span
              className={`relative h-6 w-11 rounded-full ${
                settings.notif ? 'bg-violet-600' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  settings.notif ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>
          <p className={`mt-2 text-xs ${muted}`}>
            Ye preference toggle hai; push notifications ke liye
            additional service chahiye.
          </p>
        </div>
      </div>

      <div className={`space-y-5 rounded-2xl ${card} border border-white/5 p-5`}>
        <div>
          <h3 className={sectionTitle}>Investment preferences</h3>
          <p className={`mt-1 text-xs ${muted}`}>
            Ye settings hain, financial advice nahi.
          </p>
        </div>

        <div>
          <p className={`mb-3 text-sm font-semibold ${muted}`}>
            {t.riskProfile}
          </p>
          <div className="space-y-2">
            {riskOptions.map((option) => {
              const active = settings.risk === option.value;

              return (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={active}
                  onClick={() => update({ risk: option.value })}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    active
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? 'border-violet-500 bg-violet-600'
                        : 'border-zinc-500'
                    }`}
                  >
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className={`mt-1 block text-xs ${muted}`}>
                      {option.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="investment-goal"
            className={`mb-2 block text-sm font-semibold ${muted}`}
          >
            {t.investmentGoal}
          </label>
          <textarea
            id="investment-goal"
            value={settings.goal}
            onChange={(event) => update({ goal: event.target.value })}
            placeholder={t.goalPlaceholder}
            maxLength={300}
            rows={3}
            className={`${inputClass} resize-y`}
          />
          <p className={`mt-1 text-right text-xs ${muted}`}>
            {settings.goal.length}/300
          </p>
        </div>
      </div>

      <div className={`rounded-2xl ${card} border border-white/5 p-4`}>
        <p className="text-sm font-semibold">{t.appName}</p>
        <p className={`mt-1 text-xs leading-relaxed ${muted}`}>
          Market data aur screening tools informational purposes ke liye
          hain. Investing mein loss ka risk hota hai; returns guaranteed
          nahi hain.
        </p>
        <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
          {t.disclaimer}
        </p>
      </div>
    </section>
  );
}          


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <p className={`text-sm ${muted} mb-2`}>{t.language}</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <div className="flex gap-2">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <button className={btn(settings.lang === 'en')} onClick={() => update({ lang: 'en' })}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  English
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <button className={btn(settings.lang === 'hi')} onClick={() => update({ lang: 'hi' })}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Hinglish
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <div className="flex items-center justify-between">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <p className="text-sm">{t.notifications}</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <button className={btn(settings.notif)} onClick={() => update({ notif: !settings.notif })}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              {settings.notif ? t.on : t.off}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <div className={`rounded-2xl ${card} p-5 space-y-3`}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <h2 className="text-base font-semibold">{t.risk}</h2>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <div className="flex gap-2 flex-wrap">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      {(['conservative', 'moderate', 'aggressive'] as Risk[]).map((r) => (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <button key={r} className={btn(settings.risk === r)} onClick={() => update({ risk: r })}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                {t[r]}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ))}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <p className={`text-sm ${muted} pt-2`}>{t.goal}</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <input
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        value={settings.goal}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  onChange={(e) => update({ goal: e.target.value })}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            placeholder={t.goalPlaceholder}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      className={inputClass}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <div className={`rounded-2xl ${card} p-5`}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <h2 className="text-base font-semibold">{t.about}</h2>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <p className={`text-sm ${muted} mt-2`}>{t.aboutText}</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <p className="text-xs text-yellow-400 mt-3">{t.disclaimer}</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }
