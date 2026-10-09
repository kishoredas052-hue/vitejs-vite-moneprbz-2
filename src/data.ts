export type Tab = 'Home' | 'Stocks' | 'Watchlist' | 'Profile'
export type Timeframe = '1D' | '1W' | '1M' | '1Y'
export type Lang = 'en' | 'hi'
export type Risk = 'conservative' | 'moderate' | 'aggressive'

export type Settings = {
  dark: boolean
    lang: Lang
      notif: boolean
        risk: Risk
          goal: string
          }

          export type User = { name: string; email: string }
          export type Stock = { name: string; exch: string; price: string; change: number }

          export const text = {
            en: {
                appName: 'Pro Investment Terminal',
                    analysisOnly: 'Analysis Only',
                        nifty: 'Nifty 50',
                            picks: "Today's top picks",
                                home: 'Home',
                                    stocks: 'Stocks',
                                        watchlist: 'Watchlist',
                                            profile: 'Profile',
                                                watchEmpty: 'No stocks in watchlist yet. Add from Home or Stocks.',
                                                    addToWatch: '+ Watchlist',
                                                        inWatch: '✓ Added',
                                                            account: 'Account',
                                                                name: 'Name',
                                                                    email: 'Email',
                                                                        login: 'Login',
                                                                            logout: 'Logout',
                                                                                welcome: 'Welcome',
                                                                                    settings: 'Settings',
                                                                                        theme: 'Theme',
                                                                                            dark: 'Dark',
                                                                                                light: 'Light',
                                                                                                    language: 'Language',
                                                                                                        notifications: 'Notifications',
                                                                                                            on: 'On',
                                                                                                                off: 'Off',
                                                                                                                    risk: 'Risk profile',
                                                                                                                        conservative: 'Conservative',
                                                                                                                            moderate: 'Moderate',
                                                                                                                                aggressive: 'Aggressive',
                                                                                                                                    goal: 'Investment goal',
                                                                                                                                        goalPlaceholder: 'e.g. Retirement, House, Long-term growth',
                                                                                                                                            about: 'About',
                                                                                                                                                aboutText:
                                                                                                                                                      'Pro Investment Terminal is an analysis tool. It does not give buy or sell advice.',
                                                                                                                                                          disclaimer:
                                                                                                                                                                'Disclaimer: This is for education and analysis only. It is not investment advice. Consult a SEBI registered advisor before investing.',
                                                                                                                                                                  },
                                                                                                                                                                    hi: {
                                                                                                                                                                        appName: 'Pro Investment Terminal',
                                                                                                                                                                            analysisOnly: 'Sirf Analysis',
                                                                                                                                                                                nifty: 'Nifty 50',
                                                                                                                                                                                    picks: 'Aaj ke top picks',
                                                                                                                                                                                        home: 'Home',
                                                                                                                                                                                            stocks: 'Stocks',
                                                                                                                                                                                                watchlist: 'Watchlist',
                                                                                                                                                                                                    profile: 'Profile',
                                                                                                                                                                                                        watchEmpty: 'Watchlist mein abhi koi stock nahi hai. Home ya Stocks se add karein.',
                                                                                                                                                                                                            addToWatch: '+ Watchlist',
                                                                                                                                                                                                                inWatch: '✓ Added',
                                                                                                                                                                                                                    account: 'Account',
                                                                                                                                                                                                                        name: 'Naam',
                                                                                                                                                                                                                            email: 'Email',
                                                                                                                                                                                                                                login: 'Login',
                                                                                                                                                                                                                                    logout: 'Logout',
                                                                                                                                                                                                                                        welcome: 'Swagat hai',
                                                                                                                                                                                                                                            settings: 'Settings',
                                                                                                                                                                                                                                                theme: 'Theme',
                                                                                                                                                                                                                                                    dark: 'Dark',
                                                                                                                                                                                                                                                        light: 'Light',
                                                                                                                                                                                                                                                            language: 'Language',
                                                                                                                                                                                                                                                                notifications: 'Notifications',
                                                                                                                                                                                                                                                                    on: 'On',
                                                                                                                                                                                                                                                                        off: 'Off',
                                                                                                                                                                                                                                                                            risk: 'Risk profile',
                                                                                                                                                                                                                                                                                conservative: 'Conservative',
                                                                                                                                                                                                                                                                                    moderate: 'Moderate',
                                                                                                                                                                                                                                                                                        aggressive: 'Aggressive',
                                                                                                                                                                                                                                                                                            goal: 'Investment goal',
                                                                                                                                                                                                                                                                                                goalPlaceholder: 'Jaise: Retirement, ghar, long-term growth',
                                                                                                                                                                                                                                                                                                    about: 'About',
                                                                                                                                                                                                                                                                                                        aboutText:
                                                                                                                                                                                                                                                                                                              'Pro Investment Terminal ek analysis tool hai. Ye buy ya sell ki salah nahi deta.',
                                                                                                                                                                                                                                                                                                                  disclaimer:
                                                                                                                                                                                                                                                                                                                        'Disclaimer: Ye sirf education aur analysis ke liye hai. Ye investment advice nahi hai. Invest karne se pehle SEBI registered advisor se salah lein.',
                                                                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                                                                          export type T = typeof text.en

                                                                                                                                                                                                                                                                                                                          export const chartData: Record<Timeframe, number[]> = {
                                                                                                                                                                                                                                                                                                                            '1D': [22380, 22400, 22360, 22420, 22410, 22450, 22440, 22480],
                                                                                                                                                                                                                                                                                                                              '1W': [22100, 22250, 22180, 22320, 22290, 22400, 22380, 22450],
                                                                                                                                                                                                                                                                                                                                '1M': [21600, 21850, 21720, 22100, 21950, 22300, 22180, 22450],
                                                                                                                                                                                                                                                                                                                                  '1Y': [19800, 20500, 21200, 20900, 21600, 22000, 21500, 22450],
                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                  export const stocks: Stock[] = [
                                                                                                                                                                                                                                                                                                                                    { name: 'RELIANCE', exch: 'NSE', price: '2,945.10', change: 1.2 },
                                                                                                                                                                                                                                                                                                                                      { name: 'TCS', exch: 'NSE', price: '3,812.40', change: -0.45 },
                                                                                                                                                                                                                                                                                                                                        { name: 'NVDA', exch: 'NASDAQ', price: '$ 125.30', change: 2.1 },
                                                                                                                                                                                                                                                                                                                                        ]

                                                                                                                                                                                                                                                                                                                                        export const timeframes: Timeframe[] = ['1D', '1W', '1M', '1Y']

                                                                                                                                                                                                                                                                                                                                        export const navItems: {
                                                                                                                                                                                                                                                                                                                                          tab: Tab
                                                                                                                                                                                                                                                                                                                                            key: 'home' | 'stocks' | 'watchlist' | 'profile'
                                                                                                                                                                                                                                                                                                                                              icon: string
                                                                                                                                                                                                                                                                                                                                              }[] = [
                                                                                                                                                                                                                                                                                                                                                { tab: 'Home', key: 'home', icon: '🏠' },
                                                                                                                                                                                                                                                                                                                                                  { tab: 'Stocks', key: 'stocks', icon: '📈' },
                                                                                                                                                                                                                                                                                                                                                    { tab: 'Watchlist', key: 'watchlist', icon: '⭐' },
                                                                                                                                                                                                                                                                                                                                                      { tab: 'Profile', key: 'profile', icon: '👤' },
                                                                                                                                                                                                                                                                                                                                                      ]