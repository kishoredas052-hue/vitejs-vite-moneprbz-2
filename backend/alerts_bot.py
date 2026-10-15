import os
import time
import urllib.parse
import urllib.request

import yfinance as yf
from fastapi import APIRouter

router = APIRouter()

_SENT = {}
_STATE = {}


def _send(text):
    token = os.environ.get("TELEGRAM_TOKEN")
    chat = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return False
    data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
    url = "https://api.telegram.org/bot" + token + "/sendMessage"
    try:
        urllib.request.urlopen(url, data=data, timeout=10)
        return True
    except Exception:
        return False


def _check(sym):
    lo = float(os.environ.get("ALERT_LO", "30"))
    hi = float(os.environ.get("ALERT_HI", "70"))
    close = yf.Ticker(sym + ".NS").history(period="6mo")["Close"].dropna()
    if len(close) < 52:
        return []
    last = float(close.iloc[-1])
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rsi = float((100 - 100 / (1 + gain / loss)).iloc[-1])
    if rsi != rsi:
        return []
    sma50 = float(close.rolling(50).mean().iloc[-1])

    msgs = []
    if rsi <= lo:
        msgs.append(("lo", sym + ": RSI " + str(round(rsi, 1)) + ", oversold zone"))
    elif rsi >= hi:
        msgs.append(("hi", sym + ": RSI " + str(round(rsi, 1)) + ", overbought zone"))

    now = "up" if last > sma50 else "down"
    prev = _STATE.get(sym)
    _STATE[sym] = now
    if prev and prev != now:
        word = "upar aa gaya" if now == "up" else "neeche aa gaya"
        msgs.append(("trend", sym + ": price 50-din average ke " + word))
    return msgs


def _authorized(key):
    secret = os.environ.get("ALERT_KEY")
    return bool(secret) and key == secret


@router.get("/run-alerts")
def run_alerts(key: str = ""):
    if not _authorized(key):
        return {"error": "bad key"}
    raw = os.environ.get("WATCHLIST", "")
    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()]
    today = time.strftime("%Y-%m-%d")
    sent = []
    for sym in symbols:
        try:
            msgs = _check(sym)
        except Exception:
            continue
        for kind, text in msgs:
            k = (sym, kind, today)
            if k in _SENT:
                continue
            if _send(text + "\n(Analysis signal hai, buy/sell ki salah nahi)"):
                _SENT[k] = True
                sent.append(text)
    return {"checked": len(symbols), "sent": sent}


@router.get("/test-telegram")
def test_telegram(key: str = ""):
    if not _authorized(key):
        return {"error": "bad key"}
    ok = _send("Pro Investment Terminal: test message")
    return {"sent": ok}
    @router.get("/alerts-debug")
def alerts_debug(key: str = ""):
    secret = os.environ.get("ALERT_KEY") or ""
    return {
        "env_key_set": bool(secret),
        "env_key_length": len(secret),
        "url_key_length": len(key),
        "token_set": bool(os.environ.get("TELEGRAM_TOKEN")),
        "chat_id_set": bool(os.environ.get("TELEGRAM_CHAT_ID")),
        "watchlist_set": bool(os.environ.get("WATCHLIST")),
    }
