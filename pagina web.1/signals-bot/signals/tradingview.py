"""
Parser de webhooks de TradingView.

Formato de alerta recomendado en TradingView (JSON):
────────────────────────────────────────────────────
{
  "secret":    "TU_SECRETO",
  "symbol":    "{{ticker}}",
  "action":    "BUY",
  "price":     {{close}},
  "interval":  "{{interval}}",
  "exchange":  "{{exchange}}",
  "message":   "Texto libre de la alerta"
}
────────────────────────────────────────────────────
O formato texto plano (más simple):
  TU_SECRETO|BUY|BTCUSDT|45200.5|4h|Descripción opcional

También acepta el JSON mínimo:
  {"secret": "...", "action": "BUY", "symbol": "BTCUSDT"}
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional


# Mapeo de acciones a emojis
ACTION_EMOJI = {
    "BUY":         "📈 COMPRA",
    "STRONG_BUY":  "🚀 COMPRA FUERTE",
    "SELL":        "📉 VENTA",
    "STRONG_SELL": "💥 VENTA FUERTE",
    "ALERT":       "⚠️ ALERTA",
    "LONG":        "📈 LONG",
    "SHORT":       "📉 SHORT",
    "CLOSE":       "🔲 CERRAR POSICIÓN",
    "NEUTRAL":     "⚖️ NEUTRAL",
}


def parse_payload(raw: str | dict) -> Optional[dict]:
    """
    Intenta parsear el payload de TradingView.
    Acepta dict (JSON) o string (texto plano pipe-separated).
    Retorna un dict normalizado o None si es inválido.
    """
    if isinstance(raw, dict):
        return _from_json(raw)
    if isinstance(raw, str):
        raw = raw.strip()
        # Intentar como JSON primero
        import json
        try:
            return _from_json(json.loads(raw))
        except Exception:
            pass
        # Intentar como texto plano: secreto|accion|symbol|precio|intervalo|mensaje
        return _from_text(raw)
    return None


def _from_json(data: dict) -> dict:
    action = str(data.get("action", "ALERT")).upper()
    return {
        "secret":   str(data.get("secret", "")),
        "symbol":   str(data.get("symbol", data.get("ticker", ""))).upper(),
        "action":   action,
        "price":    data.get("price", data.get("close")),
        "interval": str(data.get("interval", data.get("timeframe", ""))),
        "exchange": str(data.get("exchange", "")),
        "message":  str(data.get("message", data.get("msg", ""))),
    }


def _from_text(text: str) -> Optional[dict]:
    parts = [p.strip() for p in text.split("|")]
    if len(parts) < 2:
        return None
    return {
        "secret":   parts[0] if len(parts) > 0 else "",
        "action":   parts[1].upper() if len(parts) > 1 else "ALERT",
        "symbol":   parts[2].upper() if len(parts) > 2 else "",
        "price":    parts[3] if len(parts) > 3 else None,
        "interval": parts[4] if len(parts) > 4 else "",
        "exchange": "",
        "message":  parts[5] if len(parts) > 5 else "",
    }


def build_telegram_message(data: dict) -> str:
    action_str = ACTION_EMOJI.get(data["action"], f"📡 {data['action']}")
    now = datetime.utcnow().strftime("%d/%m/%Y %H:%M")

    lines = [
        f"📡 *SEÑAL TRADINGVIEW*",
        f"{'─'*32}",
        f"*{action_str}*",
        f"{'─'*32}",
    ]

    if data.get("symbol"):
        lines.append(f"🪙 Par: `{data['symbol']}`")
    if data.get("exchange"):
        lines.append(f"🏦 Exchange: `{data['exchange']}`")
    if data.get("price"):
        lines.append(f"💵 Precio: `{data['price']}`")
    if data.get("interval"):
        lines.append(f"📊 Temporalidad: `{data['interval']}`")
    if data.get("message"):
        lines.append(f"\n📝 {data['message']}")

    lines += [
        f"\n{'─'*32}",
        f"⏰ `{now} UTC`",
        f"⚠️ _Señal informativa. No es asesoría financiera._",
    ]
    return "\n".join(lines)
