import type { Stock, T } from './data'

type Props = {
  items: Stock[]
    card: string
      muted: string
        t: T
          watch: string[]
            onToggle: (name: string) => void
            }

            export default function StockList({ items, card, muted, t, watch, onToggle }: Props) {
              return (
                  <>
                        {items.map((s) => {
                                const added = watch.includes(s.name)
                                        return (
                                                  <div
                                                              key={s.name}
                                                                          className={`flex justify-between items-center ${card} rounded-xl p-4 mb-3`}
                                                                                    >
                                                                                                <div>
                                                                                                              <p className="font-semibold">{s.name}</p>
                                                                                                                            <p className={`text-xs ${muted}`}>{s.exch}</p>
                                                                                                                                        </div>
                                                                                                                                                    <div className="text-right">
                                                                                                                                                                  <p className="font-semibold">{s.price}</p>
                                                                                                                                                                                <p className={s.change >= 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                                                                                                                                                                                                {s.change >= 0 ? '+' : ''}
                                                                                                                                                                                                                {s.change.toFixed(2)}%
                                                                                                                                                                                                                              </p>
                                                                                                                                                                                                                                            <button
                                                                                                                                                                                                                                                            onClick={() => onToggle(s.name)}
                                                                                                                                                                                                                                                                            className={`mt-2 text-xs px-2 py-1 rounded-full ${
                                                                                                                                                                                                                                                                                              added ? 'bg-violet-600 text-white' : `border border-zinc-600 ${muted}`
                                                                                                                                                                                                                                                                                                              }`}
                                                                                                                                                                                                                                                                                                                            >
                                                                                                                                                                                                                                                                                                                                            {added ? t.inWatch : t.addToWatch}
                                                                                                                                                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                                                                                                                                                              })}
                                                                                                                                                                                                                                                                                                                                                                                                  </>
                                                                                                                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                                                    }