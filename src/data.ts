
export type Stock = {
  name: string;
  exch: string;
  price: string;
  change: number;
};

export type Tab = "Home" | "Stocks" | "Watchlist" | "Profile";

export type RiskLevel = "conservative" | "moderate" | "aggressive";

export type Settings = {
  dark: boolean;
  lang: "en" | "hi";
  notif: boolean;
  risk: RiskLevel;
  goal: string;
};

export type User = {
  name: string;
  email: string;
};

export type Timeframe = "1D" | "1W" | "1M" | "1Y";

export type T = {
  appName: string;
  analysisOnly: string;
  home: string;
  stocks: string;
  watchlist: string;
  profile: string;
  inWatch: string;
  addToWatch: string;
  watchEmpty: string;
  searchPlaceholder: string;
  marketPulse: string;
  topPicks: string;
  marketMovers: string;
  settings: string;
  account: string;
  welcome: string;
  logout: string;
  name: string;
  email: string;
  login: string;
  theme: string;
  dark: string;
  light: string;
  darkMode: string;
  notifications: string;
  language: string;
  on: string;
  off: string;
  riskProfile: string;
  conservative: string;
  moderate: string;
  aggressive: string;
  investmentGoal: string;
  goal: string;
  goalPlaceholder: string;
  about: string;
  aboutText: string;
  disclaimer: string;
  save: string;
  back: string;
  signIn: string;
  signOut: string;
};

export const text: Record<"en" | "hi", T> = {
  en: {
    appName: "StockSaathi",
    analysisOnly: "Research tools · Not financial advice",
    home: "Home",
    stocks: "Markets",
    watchlist: "Watchlist",
    profile: "Profile",
    inWatch: "Added ✓",
    addToWatch: "+ Watch",
    watchEmpty: "Your watchlist is empty. Add stocks to follow them here.",
    searchPlaceholder: "Search stocks or symbols...",
    marketPulse: "Market Pulse",
    topPicks: "Stocks to Explore",
    marketMovers: "Market Movers",
    settings: "Settings",
    account: "Account",
    welcome: "Welcome",
    logout: "Log out",
    name: "Name",
    email: "Email",
    login: "Create profile",
    theme: "Appearance",
    dark: "Dark",
    light: "Light",
    darkMode: "Dark mode",
    notifications: "Notifications",
    language: "Language",
    on: "On",
    off: "Off",
    riskProfile: "Risk preference",
    conservative: "Conservative",
    moderate: "Moderate",
    aggressive: "Aggressive",
    investmentGoal: "Investment goal",
    goal: "Goal",
    goalPlaceholder: "e.g. retirement, home, long-term growth",
    about: "About",
    aboutText: "StockSaathi is a stock research and analysis tool.",
    disclaimer:
      "For education and analysis only. Not investment advice. Consider consulting a SEBI-registered investment adviser.",
    save: "Save changes",
    back: "Back",
    signIn: "Create local profile",
    signOut: "Clear profile",
  },

  hi: {
    appName: "StockSaathi",
    analysisOnly: "Research tools · Financial advice nahi",
    home: "Home",
    stocks: "Markets",
    watchlist: "Watchlist",
    profile: "Profile",
    inWatch: "Added ✓",
    addToWatch: "+ Watch",
    watchEmpty: "Abhi watchlist khaali hai. Stocks add karke yahan track karo.",
    searchPlaceholder: "Stock ya symbol search karo...",
    marketPulse: "Market ka haal",
    topPicks: "Explore karne layak stocks",
    marketMovers: "Market Movers",
    settings: "Settings",
    account: "Account",
    welcome: "Welcome",
    logout: "Log out",
    name: "Naam",
    email: "Email",
    login: "Profile banao",
    theme: "Display",
    dark: "Dark",
    light: "Light",
    darkMode: "Dark mode",
    notifications: "Notifications",
    language: "Language",
    on: "On",
    off: "Off",
    riskProfile: "Risk preference",
    conservative: "Kam risk",
    moderate: "Medium risk",
    aggressive: "High risk",
    investmentGoal: "Investment goal",
    goal: "Goal",
    goalPlaceholder: "Jaise: retirement, ghar, long-term growth",
    about: "About",
    aboutText: "StockSaathi ek stock research aur analysis tool hai.",
    disclaimer:
      "Ye sirf education aur analysis ke liye hai, investment advice nahi. Zarurat ho toh SEBI-registered adviser se salah lein.",
    save: "Changes save karo",
    back: "Wapas",
    signIn: "Local profile banao",
    signOut: "Profile clear karo",
  },
};

export const chartData: Record<Timeframe, number[]> = {
  "1D": [22380, 22400, 22360, 22420, 22410, 22450, 22440, 22480],
  "1W": [22100, 22250, 22180, 22320, 22290, 22400, 22380, 22450],
  "1M": [21600, 21850, 21720, 22100, 21950, 22300, 22180, 22450],
  "1Y": [19800, 20500, 21200, 20900, 21600, 22000, 21500, 22450],
};

export const stocks: Stock[] = [
  { name: "RELIANCE", exch: "NSE", price: "—", change: 0 },
  { name: "HDFCBANK", exch: "NSE", price: "—", change: 0 },
  { name: "ICICIBANK", exch: "NSE", price: "—", change: 0 },
  { name: "INFY", exch: "NSE", price: "—", change: 0 },
  { name: "TCS", exch: "NSE", price: "—", change: 0 },
  { name: "TATAMOTORS", exch: "NSE", price: "—", change: 0 },
  { name: "SBIN", exch: "NSE", price: "—", change: 0 },
  { name: "ITC", exch: "NSE", price: "—", change: 0 },
  { name: "NIFTYBEES", exch: "NSE", price: "—", change: 0 },
  { name: "GOLDBEES", exch: "NSE", price: "—", change: 0 },
  { name: "AAPL", exch: "NASDAQ", price: "—", change: 0 },
  { name: "MSFT", exch: "NASDAQ", price: "—", change: 0 },
  { name: "NVDA", exch: "NASDAQ", price: "—", change: 0 },
];

export const timeframes: Timeframe[] = ["1D", "1W", "1M", "1Y"];

export const navItems: {
  tab: Tab;
  key: keyof T;
  icon: string;
}[] = [
  { tab: "Home", key: "home", icon: "⌂" },
  { tab: "Stocks", key: "stocks", icon: "↗" },
  { tab: "Watchlist", key: "watchlist", icon: "☆" },
  { tab: "Profile", key: "profile", icon: "☻" },
];
    
