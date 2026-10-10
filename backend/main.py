from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
