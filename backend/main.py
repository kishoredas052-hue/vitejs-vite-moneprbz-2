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


@app.get("/")
def root():
    return {"status": "ok"}


def _quote(symbol: str):
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="5d")
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
