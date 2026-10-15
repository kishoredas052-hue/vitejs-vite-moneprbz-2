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
    return seen


def _rsi(close):
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    v = (100 - 100 / (1 + gain / loss)).iloc[-1]
    return None if v != v else float(v)


def _tech(last, sma20, sma50, rsi):
    score = 0
    reasons = []
    if last > sma50:
        score += 1
        reasons.append("Price 50-din average ke upar hai")
    else:
        score -= 1
        reasons.append("Price 50-din average ke neeche hai")
    if sma20 > sma50:
        score += 1
        reasons.append("20-din average 50-din ke upar hai")
    if rsi >= 70:
        score -= 1
        reasons.append("RSI 70 se upar: overbought")
    elif rsi <= 30:
        score += 1
        reasons.append("RSI 30 se neeche: oversold")
    elif rsi >= 40:
        score += 1
        reasons.append("RSI 40-70 range mein hai")
    return score, reasons


def _verdict(score):
    if score >= 3:
        return "Positive bias"
    if score >= 1:
        return "Neutral"
    return "Weak bias"


def _compute():
    tickers = _tickers()
    df = yf.download(
        [t + ".NS" for t in tickers],
        period="6mo",
        interval="1d",
        group_by="ticker",
        threads=True,
        progress=False,
    )

    rows = []
    for sym in tickers:
        try:
            close = df[sym + ".NS"]["Close"].dropna()
        except Exception:
            continue
        if len(close) < 52:
            continue
        last = float(close.iloc[-1])
        prev = float(close.iloc[-2])
        sma20 = float(close.rolling(20).mean().iloc[-1])
        sma50 = float(close.rolling(50).mean().iloc[-1])
        rsi = _rsi(close)
        if rsi is None:
            continue
        ret20 = (last / float(close.iloc[-21]) - 1) * 100
        score, reasons = _tech(last, sma20, sma50, rsi)
        rows.append({
            "symbol": sym,
            "price": round(last, 2),
            "change_percent": round((last - prev) / prev * 100, 2),
            "rsi": round(rsi, 1),
            "ret20": round(ret20, 1),
            "score": score,
            "verdict": _verdict(score),
            "reasons": reasons,
            "pe": None,
            "roe": None,
        })

    rows.sort(key=lambda r: (r["score"], r["ret20"]), reverse=True)

    return {
        "picks": rows[:5],
        "scanned": len(rows),
        "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


@router.get("/top-picks")
def top_picks():
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
