import threading
import time
from datetime import datetime, timedelta, timezone
import yfinance as yf
from fastapi import APIRouter
from nifty100 import NIFTY100

router = APIRouter()

_IST = timezone(timedelta(hours=5, minutes=30))
_LOCK = threading.Lock()
_SHARED_RAW = {"ts": 0.0, "df": None, "tickers": [], "updated": ""}
_PULSE_CACHE = {"ts": 0.0, "data": None}
_TTL = 900  # 15 minutes


def _ist_now_str():
    return datetime.now(_IST).strftime("%Y-%m-%d %H:%M:%S IST")


def get_unique_symbols():
    seen = []
    for sym in NIFTY100.values():
        if sym not in seen:
            seen.append(sym)
    return seen


def get_shared_market_df():
    """Downloads 248 NSE tickers + ^NSEI only ONCE and shares across all endpoints."""
    now = time.time()
    if _SHARED_RAW["df"] is not None and (now - _SHARED_RAW["ts"] < _TTL):
        return _SHARED_RAW["df"], _SHARED_RAW["tickers"], _SHARED_RAW["updated"]

    with _LOCK:
        now = time.time()
        if _SHARED_RAW["df"] is not None and (now - _SHARED_RAW["ts"] < _TTL):
            return _SHARED_RAW["df"], _SHARED_RAW["tickers"], _SHARED_RAW["updated"]

        symbols = get_unique_symbols()
        ns_tickers = [s + ".NS" for s in symbols]
        all_tickers = ns_tickers + ["^NSEI"]

        df = yf.download(
            all_tickers,
            period="6mo",
            interval="1d",
            group_by="ticker",
            threads=True,
            progress=False,
        )
        updated_str = _ist_now_str()
        _SHARED_RAW["ts"] = time.time()
        _SHARED_RAW["df"] = df
        _SHARED_RAW["tickers"] = symbols
        _SHARED_RAW["updated"] = updated_str
        return df, symbols, updated_str


def _mood(nifty):
    if not nifty:
        return "Unknown"
    up_trend = nifty["above_sma50"]
    day_up = nifty["change_percent"] >= 0
    if up_trend and day_up:
        return "Bullish"
    if up_trend and not day_up:
        return "Neutral"
    if not up_trend and day_up:
        return "Recovering"
    return "Weak"


def _compute():
    df, symbols, updated_str = get_shared_market_df()
    tickers = [s + ".NS" for s in symbols] + ["^NSEI"]

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

    return {
        "mood": _mood(nifty),
        "nifty": nifty,
        "breadth": {
            "above_sma50": above,
            "total": counted,
            "percent": round(above / counted * 100) if counted else 0,
        },
        "gainers": rows[:5],
        "losers": list(reversed(rows[-5:])) if rows else [],
        "all_stocks": rows,
        "updated": updated_str,
    }


@router.get("/market-pulse")
def market_pulse():
    now = time.time()
    if _PULSE_CACHE["data"] and now - _PULSE_CACHE["ts"] < _TTL:
        return {**_PULSE_CACHE["data"], "cached": True}
    try:
        data = _compute()
    except Exception as e:
        return {"error": type(e).__name__ + ": " + str(e)[:200]}
    _PULSE_CACHE["ts"] = now
    _PULSE_CACHE["data"] = data
    return {**data, "cached": False}
    
