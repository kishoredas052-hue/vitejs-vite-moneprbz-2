import json as _json
import os
import time as _time
import urllib.error as _urlerr
import urllib.request as _urlreq

import yfinance as yf
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from nifty100 import NIFTY100 as _NIFTY100, ETFS_UNIVERSE
from market_pulse import router as market_pulse_router
from top_picks import router as top_picks_router, get_all_scored_stocks

app = FastAPI(title="Pro Investment Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(market_pulse_router)
app.include_router(top_picks_router)

TF_CONFIG = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "30m"),
    "1M": ("1mo", "1d"),
    "1Y": ("1y", "1wk"),
}

UNIVERSE = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS", "HINDUNILVR.NS",
    "KOTAKBANK.NS", "AXISBANK.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS",
    "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS", "NESTLEIND.NS",
]


def _num(value):
    try:
        number = float(value)
        if number != number or number in (float("inf"), float("-inf")):
            return None
        return round(number, 2)
    except (TypeError, ValueError, OverflowError):
        return None


def _quote(symbol: str):
    try:
        hist = yf.Ticker(symbol).history(period="5d")
        if hist.empty or "Close" not in hist.columns:
            return None
        close = hist["Close"].dropna()
        if close.empty:
            return None
        last = float(close.iloc[-1])
        prev = float(close.iloc[-2]) if len(close) > 1 else last
        change = ((last - prev) / prev * 100) if prev else 0.0
        return {"symbol": symbol, "price": round(last, 2), "change_percent": round(change, 2)}
    except Exception:
        return None


def _get_fundamentals(ticker):
    try:
        info = ticker.get_info() or {}
        if isinstance(info, dict) and info:
            return info
    except Exception:
        pass
    try:
        info = ticker.info or {}
        if isinstance(info, dict):
            return info
    except Exception:
        pass
    return {}


def _analyze(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1y", interval="1d")
    except Exception:
        return None

    if hist is None or hist.empty or len(hist) < 30 or "Close" not in hist.columns:
        return None
    close = hist["Close"].dropna()
    if len(close) < 30:
        return None

    last = float(close.iloc[-1])
    prev = float(close.iloc[-2]) if len(close) > 1 else last
    change_pct = round(((last - prev) / prev * 100) if prev else 0.0, 2)

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    latest_gain, latest_loss = gain.iloc[-1], loss.iloc[-1]
    if latest_gain != latest_gain or latest_loss != latest_loss:
        rsi = None
    elif latest_loss == 0:
        rsi = 100.0 if latest_gain > 0 else 50.0
    else:
        rsi = _num(100 - 100 / (1 + latest_gain / latest_loss))

    sma20 = _num(close.rolling(20).mean().iloc[-1])
    sma50 = _num(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None
    sma200 = _num(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else None

    volume = None
    if "Volume" in hist.columns:
        volumes = hist["Volume"].dropna()
        if not volumes.empty:
            try:
                volume = int(volumes.iloc[-1])
            except (TypeError, ValueError, OverflowError):
                volume = None

    info = _get_fundamentals(ticker)
    etf_symbols = {f"{etf_symbol}.NS" for etf_symbol in ETFS_UNIVERSE.values()}
    is_etf = symbol in etf_symbols
    pe = None if is_etf else _num(info.get("trailingPE"))
    roe_raw = info.get("returnOnEquity")
    roe = _num(roe_raw * 100) if isinstance(roe_raw, (int, float)) else None

    score, reasons = 0, []
    if sma50 is not None:
        if last > sma50:
            score += 1
            reasons.append("Price 50-din average ke upar hai")
        else:
            score -= 1
            reasons.append("Price 50-din average ke neeche hai")
        if sma20 is not None and sma20 > sma50:
            score += 1
            reasons.append("20-din average 50-din ke upar hai")

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

    verdict_text = "Positive bias" if score >= 3 else "Neutral" if score >= 1 else "Weak bias"
    return {
        "symbol": symbol, "price": round(last, 2), "change_percent": change_pct,
        "sma20": sma20, "sma50": sma50, "sma200": sma200, "volume": volume,
        "rsi": rsi, "pe": pe, "roe": roe, "score": score,
        "verdict": verdict_text, "reasons": reasons,
    }


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/price/{symbol}")
def price(symbol: str):
    data = _quote(symbol)
    return data if data is not None else {"symbol": symbol, "error": "no data"}


@app.get("/index/nifty")
def nifty():
    data = _quote("^NSEI")
    return data if data is not None else {"symbol": "^NSEI", "error": "no data"}


@app.get("/history")
def history(symbol: str = Query(...), tf: str = Query("1M")):
    period, interval = TF_CONFIG.get(tf, TF_CONFIG["1M"])
    try:
        hist = yf.Ticker(symbol).history(period=period, interval=interval)
    except Exception:
        hist = None
    if hist is None or hist.empty or "Close" not in hist.columns:
        return {"symbol": symbol, "tf": tf, "points": []}
    closes = [round(float(value), 2) for value in hist["Close"].dropna().tolist()]
    return {"symbol": symbol, "tf": tf, "points": closes}


@app.get("/analysis")
def analysis(symbol: str = Query(...)):
    data = _analyze(symbol)
    return data if data is not None else {"symbol": symbol, "error": "not enough data"}


@app.get("/screener")
def screener(min_rsi: float = Query(0), max_rsi: float = Query(100),
             max_pe: float = Query(1000), trend: str = Query("any")):
    try:
        rows, updated_str = get_all_scored_stocks()
    except Exception as exc:
        return {"count": 0, "results": [], "error": str(exc)}
    results = []
    for item in rows:
        rsi_value = item.get("rsi")
        if rsi_value is None or rsi_value < min_rsi or rsi_value > max_rsi:
            continue
        pe_value = item.get("pe")
        if pe_value is not None and pe_value > max_pe:
            continue
        sma50_value, price_value = item.get("sma50"), item.get("price")
        if trend == "up" and not (sma50_value and price_value > sma50_value):
            continue
        if trend == "down" and not (sma50_value and price_value < sma50_value):
            continue
        results.append(item)
    return {"count": len(results), "results": results, "updated": updated_str}


_AI_CACHE, _AI_TTL = {}, 3600


def _gemini_text(prompt: str):
    key = os.environ.get("GEMINI_API_KEY", "")
    model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    if not key:
        return None, "GEMINI_API_KEY set nahi hai (Render Environment mein add karein)"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = _json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 400, "temperature": 0.3},
    }).encode("utf-8")
    request = _urlreq.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with _urlreq.urlopen(request, timeout=40) as response:
            data = _json.loads(response.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"].strip(), None
    except _urlerr.HTTPError as exc:
        return None, f"Gemini error {exc.code}: quota ya API key check karein"
    except Exception as exc:
        return None, f"AI call fail: {type(exc).__name__}"


def _ai_prompt(symbol: str, data: dict):
    facts = {key: data.get(key) for key in
             ["price", "sma20", "sma50", "rsi", "pe", "roe", "verdict", "reasons"]}
    return (
        "Tum ek stock analysis assistant ho. Neeche diye data se 4-5 chhoti lines mein "
        "Hinglish (Roman Hindi + English) mein summary likho: trend, momentum (RSI), "
        "valuation (PE), aur ek main risk. Koi buy ya sell ki salah mat do. "
        "Aakhir mein likho: 'Ye sirf analysis hai, investment advice nahi.'\n\n"
        f"Stock: {symbol}\nData: {_json.dumps(facts, ensure_ascii=False)}"
    )


@app.get("/verdict")
def verdict(symbol: str = Query(...)):
    now = _time.time()
    cached = _AI_CACHE.get(symbol)
    if cached and now - cached[0] < _AI_TTL:
        return {"symbol": symbol, "text": cached[1], "cached": True}
    data = _analyze(symbol)
    if data is None:
        return {"symbol": symbol, "error": "analysis data nahi mila"}
    text, error = _gemini_text(_ai_prompt(symbol, data))
    if error:
        return {"symbol": symbol, "error": error}
    _AI_CACHE[symbol] = (now, text)
    return {"symbol": symbol, "text": text, "cached": False}


_AI_CACHE2, _AI_TTL2 = {}, 3600


def _groq_text(prompt: str):
    key = os.environ.get("GROQ_API_KEY", "")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    if not key:
        return None, "GROQ_API_KEY set nahi hai (Render Environment mein add karein)"
    body = _json.dumps({
        "model": model, "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 400, "temperature": 0.3,
    }).encode("utf-8")
    request = _urlreq.Request(
        "https://api.groq.com/openai/v1/chat/completions", data=body,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {key}",
                 "User-Agent": "pro-investment-terminal/1.0"},
    )
    try:
        with _urlreq.urlopen(request, timeout=40) as response:
            data = _json.loads(response.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip(), None
    except _urlerr.HTTPError as exc:
        return None, f"Groq error {exc.code}: key ya model check karein"
    except Exception as exc:
        return None, f"AI call fail: {type(exc).__name__}"


@app.get("/ai-verdict")
def ai_verdict(symbol: str = Query(...)):
    now = _time.time()
    cached = _AI_CACHE2.get(symbol)
    if cached and now - cached[0] < _AI_TTL2:
        return {"symbol": symbol, "text": cached[1], "cached": True}
    data = _analyze(symbol)
    if data is None:
        return {"symbol": symbol, "error": "analysis data nahi mila"}
    text, error = _groq_text(_ai_prompt(symbol, data))
    if error:
        return {"symbol": symbol, "error": error}
    _AI_CACHE2[symbol] = (now, text)
    return {"symbol": symbol, "text": text, "cached": False}


@app.get("/groq-debug")
def groq_debug():
    key = os.environ.get("GROQ_API_KEY", "")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    info = {"key_len": len(key), "model_repr": repr(model)}
    body = _json.dumps({
        "model": model, "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 5,
    }).encode("utf-8")
    request = _urlreq.Request(
        "https://api.groq.com/openai/v1/chat/completions", data=body,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {key}",
                 "User-Agent": "pro-investment-terminal/1.0"},
    )
    try:
        with _urlreq.urlopen(request, timeout=40) as response:
            info["status"] = response.status
            info["body"] = response.read().decode("utf-8")[:400]
    except _urlerr.HTTPError as exc:
        info["status"] = exc.code
        info["body"] = exc.read().decode("utf-8", "ignore")[:400]
    except Exception as exc:
        info["error"] = type(exc).__name__ + ": " + str(exc)[:200]
    return info


@app.get("/symbols")
def symbols(q: str = Query("")):
    query_lower = q.strip().lower()
    items = []
    for name, symbol in _NIFTY100.items():
        if not query_lower or query_lower in name.lower() or query_lower in symbol.lower():
            items.append({"name": name, "symbol": symbol})
    return {"count": len(items), "items": items[:50]}


@app.get("/etfs")
def etfs_screener():
    results = []
    for name, symbol in ETFS_UNIVERSE.items():
        data = _analyze(symbol + ".NS")
        if data:
            results.append({
                "name": name, "symbol": symbol, "price": data["price"],
                "change_percent": data.get("change_percent", 0), "rsi": data["rsi"],
                "score": data["score"], "verdict": data["verdict"],
            })
    results.sort(key=lambda item: item["score"], reverse=True)
    return {"count": len(results), "results": results}
