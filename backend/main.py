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

UNIVERSE = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS", "HINDUNILVR.NS",
    "KOTAKBANK.NS", "AXISBANK.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS",
    "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS", "NESTLEIND.NS",
]


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


def _analyze(symbol: str):
    t = yf.Ticker(symbol)
    hist = t.history(period="1y", interval="1d")
    if hist.empty or len(hist) < 30:
        return None

    close = hist["Close"].dropna()
    last = float(close.iloc[-1])

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rsi = _num((100 - 100 / (1 + gain / loss)).iloc[-1])

    sma20 = _num(close.rolling(20).mean().iloc[-1])
    sma50 = _num(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None

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
        "pe": pe,
        "roe": roe,
        "score": score,
        "verdict": verdict,
        "reasons": reasons,
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
    data = _analyze(symbol)
    if data is None:
        return {"symbol": symbol, "error": "not enough data"}
    return data


@app.get("/screener")
def screener(
    min_rsi: float = Query(0),
    max_rsi: float = Query(100),
    max_pe: float = Query(1000),
    trend: str = Query("any"),
):
    results = []
    for sym in UNIVERSE:
        try:
            a = _analyze(sym)
        except Exception:
            a = None
        if a is None:
            continue
        rsi = a["rsi"]
        pe = a["pe"]
        if rsi is None or rsi < min_rsi or rsi > max_rsi:
            continue
        if pe is not None and pe > max_pe:
            continue
        if trend == "up" and not (a["sma50"] and a["price"] > a["sma50"]):
            continue
        if trend == "down" and not (a["sma50"] and a["price"] < a["sma50"]):
            continue
        results.append(a)
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"count": len(results), "results": results}

import json as _json
import time as _time
import urllib.request as _urlreq
import urllib.error as _urlerr

_AI_CACHE = {}
_AI_TTL = 3600


def _gemini_text(prompt: str):
    import os
    key = os.environ.get("GEMINI_API_KEY", "")
    model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    if not key:
        return None, "GEMINI_API_KEY set nahi hai (Render Environment mein add karein)"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = _json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 400, "temperature": 0.3},
    }).encode("utf-8")
    req = _urlreq.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with _urlreq.urlopen(req, timeout=40) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip(), None
    except _urlerr.HTTPError as e:
        return None, f"Gemini error {e.code}: quota ya API key check karein"
    except Exception as e:
        return None, f"AI call fail: {type(e).__name__}"


@app.get("/verdict")
def verdict(symbol: str = Query(...)):
    now = _time.time()
    cached = _AI_CACHE.get(symbol)
    if cached and now - cached[0] < _AI_TTL:
        return {"symbol": symbol, "text": cached[1], "cached": True}

    a = _analyze(symbol)
    if a is None:
        return {"symbol": symbol, "error": "analysis data nahi mila"}

    facts = {k: a.get(k) for k in ["price", "sma20", "sma50", "rsi", "pe", "roe", "verdict", "reasons"]}
    prompt = (
        "Tum ek stock analysis assistant ho. Neeche diye data se 4-5 chhoti lines mein "
        "Hinglish (Roman Hindi + English) mein summary likho: trend, momentum (RSI), "
        "valuation (PE), aur ek main risk. Koi buy ya sell ki salah mat do. "
        "Aakhir mein likho: 'Ye sirf analysis hai, investment advice nahi.'\n\n"
        f"Stock: {symbol}\nData: {_json.dumps(facts, ensure_ascii=False)}"
    )
    text, err = _gemini_text(prompt)
    if err:
        return {"symbol": symbol, "error": err}
    _AI_CACHE[symbol] = (now, text)
    return {"symbol": symbol, "text": text, "cached": False}

import json as _json
import time as _time
import urllib.request as _urlreq
import urllib.error as _urlerr

_AI_CACHE2 = {}
_AI_TTL2 = 3600


def _groq_text(prompt: str):
    import os
    key = os.environ.get("GROQ_API_KEY", "")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    if not key:
        return None, "GROQ_API_KEY set nahi hai (Render Environment mein add karein)"
    body = _json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 400,
        "temperature": 0.3,
    }).encode("utf-8")
    req = _urlreq.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "User-Agent": "pro-investment-terminal/1.0",
        },
    )
    try:
        with _urlreq.urlopen(req, timeout=40) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
        text = data["choices"][0]["message"]["content"]
        return text.strip(), None
    except _urlerr.HTTPError as e:
        return None, f"Groq error {e.code}: key ya model check karein"
    except Exception as e:
        return None, f"AI call fail: {type(e).__name__}"


@app.get("/ai-verdict")
def ai_verdict(symbol: str = Query(...)):
    now = _time.time()
    cached = _AI_CACHE2.get(symbol)
    if cached and now - cached[0] < _AI_TTL2:
        return {"symbol": symbol, "text": cached[1], "cached": True}

    a = _analyze(symbol)
    if a is None:
        return {"symbol": symbol, "error": "analysis data nahi mila"}

    facts = {k: a.get(k) for k in ["price", "sma20", "sma50", "rsi", "pe", "roe", "verdict", "reasons"]}
    prompt = (
        "Tum ek stock analysis assistant ho. Neeche diye data se 4-5 chhoti lines mein "
        "Hinglish (Roman Hindi + English) mein summary likho: trend, momentum (RSI), "
        "valuation (PE), aur ek main risk. Koi buy ya sell ki salah mat do. "
        "Aakhir mein likho: 'Ye sirf analysis hai, investment advice nahi.'\n\n"
        f"Stock: {symbol}\nData: {_json.dumps(facts, ensure_ascii=False)}"
    )
    text, err = _groq_text(prompt)
    if err:
        return {"symbol": symbol, "error": err}
    _AI_CACHE2[symbol] = (now, text)
    return {"symbol": symbol, "text": text, "cached": False}

@app.get("/groq-debug")
def groq_debug():
    import os
    key = os.environ.get("GROQ_API_KEY", "")
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    info = {"key_len": len(key), "model_repr": repr(model)}
    body = _json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 5,
    }).encode("utf-8")
    req = _urlreq.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "User-Agent": "pro-investment-terminal/1.0",
        },
    )
    try:
        with _urlreq.urlopen(req, timeout=40) as resp:
            info["status"] = resp.status
            info["body"] = resp.read().decode("utf-8")[:400]
    except _urlerr.HTTPError as e:
        info["status"] = e.code
        info["body"] = e.read().decode("utf-8", "ignore")[:400]
    except Exception as e:
        info["error"] = type(e).__name__ + ": " + str(e)[:200]
    return info
    
from nifty100 import NIFTY100 as _NIFTY100
    
@app.get("/symbols")
def symbols(q: str = Query("")):
    ql = q.strip().lower()
    items = []
    for name, sym in _NIFTY100.items():
        if not ql or ql in name.lower() or ql in sym.lower():
            items.append({"name": name, "symbol": sym})
    return {"count": len(items), "items": items[:50]}

from market_pulse import router as _pulse_router
app.include_router(_pulse_router)

from top_picks import router as _picks_router
app.include_router(_picks_router)




