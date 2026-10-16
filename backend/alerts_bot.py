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
def run_alerts(key: str = "", force: str = ""):
    if not _authorized(key):
        return {"error": "bad key"}
    if not force and not _market_open():
        return {"skipped": "market closed"}
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

def _market_open():
    ist = time.gmtime(time.time() + 19800)
    if ist.tm_wday > 4:
        return False
    minutes = ist.tm_hour * 60 + ist.tm_min
    return 9 * 60 <= minutes <= 15 * 60 + 45@router.get("/telegram-debug")
def telegram_debug(key: str = ""):
    if not _authorized(key):
        return {"error": "bad key"}
    token = os.environ.get("TELEGRAM_TOKEN") or ""
    chat = os.environ.get("TELEGRAM_CHAT_ID") or ""
    out = {
        "token_length": len(token),
        "token_has_colon": ":" in token,
        "token_has_space": token != token.strip() or " " in token,
        "chat_id_is_number": chat.strip().lstrip("-").isdigit(),
        "chat_id_has_space": chat != chat.strip(),
    }
    try:
        url = "https://api.telegram.org/bot" + token.strip() + "/getMe"
        urllib.request.urlopen(url, timeout=10)
        out["getMe"] = "ok"
    except Exception as e:
        out["getMe"] = type(e).__name__ + ": " + str(e)[:100]
    try:
        data = urllib.parse.urlencode(
            {"chat_id": chat.strip(), "text": "debug test"}
        ).encode()
        url = "https://api.telegram.org/bot" + token.strip() + "/sendMessage"
        urllib.request.urlopen(url, data=data, timeout=10)
        out["sendMessage"] = "ok"
    except urllib.error.HTTPError as e:
        out["sendMessage"] = "HTTP " + str(e.code) + " " + e.read().decode()[:150]
    except Exception as e:
        out["sendMessage"] = type(e).__name__ + ": " + str(e)[:100]
    return out
