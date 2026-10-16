import time
from fastapi import APIRouter
from market_pulse import get_shared_market_df

router = APIRouter()

_CACHE = {"ts": 0.0, "data": None}
_TTL = 900


def _rsi(close):
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    v = (100 - 100 / (1 + gain / loss)).iloc[-1]
    return None if v != v else float(v)


def _tech(last, volume, vol_sma20, ema44, sma200, rsi):
    score = 0
    reasons = []

    # 1. Trend Strategy: 44 EMA & 200 SMA Alignment
    if ema44 > sma200:
        score += 1
        reasons.append("Long-term Uptrend: 44 EMA > 200 SMA")
    if last > ema44:
        score += 1
        reasons.append("Price 44 EMA ke upar bullish hai")
    else:
        score -= 1
        reasons.append("Price 44 EMA ke neeche hai")

    # 2. Volume Surge Strategy (Breakout detection)
    if vol_sma20 and vol_sma20 > 0:
        if volume >= (2.0 * vol_sma20):
            score += 2
            reasons.append("High Volume Surge: 2x average volume")
        elif volume >= (1.2 * vol_sma20):
            score += 1
            reasons.append("Volume expansion visible hai")

    # 3. RSI Momentum & Reversal Strategy
    if 55 <= rsi <= 70:
        score += 2
        reasons.append("Strong RSI Momentum (55-70 range)")
    elif 40 <= rsi < 55:
        score += 1
        reasons.append("RSI Bullish zone mein hai")
    elif rsi <= 30:
        score += 1
        reasons.append("RSI Oversold: Reversal opportunity")
    elif rsi >= 70:
        score -= 1
        reasons.append("RSI Overbought zone")

    return score, reasons


def _verdict(score):
    if score >= 4:
        return "Strong Positive Bias"
    elif score >= 2:
        return "Positive bias"
    if score >= 0:
        return "Neutral"
    return "Weak bias"


def get_all_scored_stocks():
    df, tickers, updated_str = get_shared_market_df()

    rows = []
    for sym in tickers:
        try:
            hist = df[sym + ".NS"]
            close = hist["Close"].dropna()
            vol = hist["Volume"].dropna()
        except Exception:
            continue
        if len(close) < 200:
            continue
            
        last = float(close.iloc[-1])
        prev = float(close.iloc[-2])
        volume = float(vol.iloc[-1]) if len(vol) > 0 else 0
        vol_sma20 = float(vol.rolling(20).mean().iloc[-1]) if len(vol) >= 20 else 0
        
        ema44 = float(close.ewm(span=44, adjust=False).mean().iloc[-1])
        sma200 = float(close.rolling(200).mean().iloc[-1])
        rsi = _rsi(close)
        
        if rsi is None:
            continue

        chg_pct = round((last - prev) / prev * 100, 2)
        ret20 = round((last / float(close.iloc[-21]) - 1) * 100, 1)
        
        score, reasons = _tech(last, volume, vol_sma20, ema44, sma200, rsi)

        rows.append({
            "symbol": sym,
            "price": round(last, 2),
            "change_percent": chg_pct,
            "ema44": round(ema44, 2),
            "sma200": round(sma200, 2),
            "rsi": round(rsi, 1),
            "ret20": ret20,
            "score": score,
            "verdict": _verdict(score),
            "reasons": reasons,
            "pe": None,
            "roe": None,
        })

    # Smart Multi-factor Sorting
    rows.sort(
        key=lambda r: (
            r["score"],
            r["change_percent"] > 0,
            r["ret20"],
            r["change_percent"],
        ),
        reverse=True,
    )
    return rows, updated_str


def _compute():
    rows, updated_str = get_all_scored_stocks()
    return {
        "picks": rows[:5],
        "scanned": len(rows),
        "updated": updated_str,
    }


@router.get("/top-picks")
def top_picks():
    now = time.time()
    if _CACHE["data"] and now - _CACHE["ts"] < _TTL:
        return {**_Cache["data"], "cached": True}
    try:
        data = _compute()
    except Exception as e:
        return {"error": type(e).__name__ + ": " + str(e)[:200]}
    _CACHE["ts"] = now
    _CACHE["data"] = data
    return {**data, "cached": False}
        
