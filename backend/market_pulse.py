import time
import yfinance as yf
from fastapi import APIRouter
from nifty100 import NIFTY100

router = APIRouter()

_CACHE = {"ts": 0.0, "data": None}
_TTL = 900


def _tickers():
    seen = []
    for sym in NIFTY100.values():
        if sym not in seen:
            seen.append(sym)
    return [s + ".NS" for s in seen]


def _compute():
    tickers = _tickers() + ["^NSEI"]
    df = yf.download(
        tickers,
        period="6mo",
        interval="1d",
        group_by="ticker",
        threads=True,
        progress=False,
    )

    rows = []
    above = 0
    counted = 0
    nifty = None

    for t in tickers:
        try:
            close = df[t]["Close"].dropna()
        except Exception:
            continue
        if len(close) < 52:
            continue
        last = float(close.iloc[-1])
        prev = float(close.iloc[-2])
        sma50 = float(close.rolling(50).mean().iloc[-1])
        chg = (last - prev) / prev * 100

        if t == "^NSEI":
            nifty = {
                "price": round(last, 2),
                "change_percent": round(chg, 2),
                "above_sma50": last > sma50,
            }
            continue

        counted += 1
        if last > sma50:
            above += 1
        rows.append({
            "symbol": t.replace(".NS", ""),
            "price": round(last, 2),
            "change_percent": round(chg, 2),
        })

    rows.sort(key=lambda x: x["change_percent"], reverse=True)

    mood = "Unknown"
    if nifty:
        if nifty["above_sma50"] and nifty["change_percent"] >= 0:
            mood = "Bullish"
        elif not nifty["above_sma50"]:
            mood = "Bearish"
        else:
            mood = "Neutral"

    return {
        "mood": mood,
        "nifty": nifty,
        "breadth": {
            "above_sma50": above,
            "total": counted,
            "percent": round(above / counted * 100) if counted else 0,
        },
        "gainers": rows[:5],
        "losers": list(reversed(rows[-5:])) if rows else [],
        "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


@router.get("/market-pulse")
def market_pulse():
    now = time.time()
    if _CACHE["data"] and now - _CACHE["ts"] < _TTL:
        return {**_CACHE["data"], "cached": True}
    try:
        data = _compute()
    except Exception as e:
        return {"error": type(e).__name__ + ": " + str(e)[:200]}
    _CACHE["ts"] = now
    _CACHE["data"] = data
    return {**data, "cached": False}
