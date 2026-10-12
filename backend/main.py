from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TF_CONFIG = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "30m"),
    "1M": ("1mo", "1d"),
    "1Y": ("1y", "1wk"),
}


def _num(v):
    try:
        f = float(v)
        return None if f != f else round(f, 2)
    except Exception:
        return None


def _quote(symbol: str):
    hist = yf.Ticker(symbol).history(period="5d")
    if hist.empty:
        return None
    last = float(hist["Close"].iloc[-1])
    prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last
    change = (last - prev) / prev * 100
    return {
        "symbol": symbol,
        "price": round(last, 2),
        "change_percent": round(change, 2),
    }


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/price/{symbol}")
def price(symbol: str):
    data = _quote(symbol)
    if data is None:
        return {"symbol": symbol, "error": "no data"}
    return data


@app.get("/index/nifty")
def nifty():
    data = _quote("^NSEI")
    if data is None:
        return {"symbol": "^NSEI", "error": "no data"}
    return data


@app.get("/history")
def history(symbol: str = Query(...), tf: str = Query("1M")):
    period, interval = TF_CONFIG.get(tf, TF_CONFIG["1M"])
    hist = yf.Ticker(symbol).history(period=period, interval=interval)
    if hist.empty:
        return {"symbol": symbol, "tf": tf, "points": []}
    closes = [round(float(v), 2) for v in hist["Close"].dropna().tolist()]
    return {"symbol": symbol, "tf": tf, "points": closes}


@app.get("/analysis")
def analysis(symbol: str = Query(...)):
    t = yf.Ticker(symbol)
    hist = t.history(period="1y", interval="1d")
    if hist.empty or len(hist) < 30:
        return {"symbol": symbol, "error": "not enough data"}

    close = hist["Close"].dropna()
    last = float(close.iloc[-1])

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rsi = _num((100 - 100 / (1 + gain / loss)).iloc[-1])

    sma20 = _num(close.rolling(20).mean().iloc[-1])
    sma50 = _num(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None
    high52 = _num(close.max())
    low52 = _num(close.min())

    try:
        info = t.info or {}
    except Exception:
        info = {}
    pe = _num(info.get("trailingPE"))
    roe_raw = info.get("returnOnEquity")
    roe = _num(roe_raw * 100) if isinstance(roe_raw, (int, float)) else None

    score = 0
    reasons = []

    if sma50 is not None:
        if last > sma50:
            score += 1
            reasons.append("Price 50-din average ke upar hai")
        else:
            score -= 1
            reasons.append("Price 50-din average ke neeche hai")
        if sma20 is not None and sma20 > sma50:
            score += 1
            reasons.append("20-din average 50-din ke upar hai (short-term trend upar)")

    if rsi is not None:
        if rsi >= 70:
            score -= 1
            reasons.append("RSI 70 se upar: overbought")
        elif rsi <= 30:
            score += 1
            reasons.append("RSI 30 se neeche: oversold")
        elif 40 <= rsi < 70:
            score += 1
            reasons.append("RSI 40-70 range mein hai")

    if pe is not None:
        if 0 < pe <= 25:
            score += 1
            reasons.append("PE 25 se kam hai")
        elif pe > 40:
            score -= 1
            reasons.append("PE 40 se zyada hai")

    if roe is not None and roe >= 15:
        score += 1
        reasons.append("ROE 15% se zyada hai")

    if score >= 3:
        verdict = "Positive bias"
    elif score >= 1:
        verdict = "Neutral"
    else:
        verdict = "Weak bias"

    return {
        "symbol": symbol,
        "price": round(last, 2),
        "sma20": sma20,
        "sma50": sma50,
        "rsi": rsi,
        "high52": high52,
        "low52": low52,
        "pe": pe,
        "roe": roe,
        "score": score,
        "verdict": verdict,
        "reasons": reasons,
    }
