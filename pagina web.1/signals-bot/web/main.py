"""
Panel web de administración — FastAPI + Jinja2
Acceso: http://TU_DOMINIO/admin
"""
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
import secrets

from config import ADMIN_PASSWORD, SECRET_KEY, PLAN_DAYS
from db.database import SessionLocal, init_db
from db.models import Payment, Signal, Subscription, User

app = FastAPI(title="Señales VIP — Admin")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

_dir = os.path.dirname(__file__)
templates = Jinja2Templates(directory=os.path.join(_dir, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(_dir, "static")), name="static")


# ── Auth ──────────────────────────────────────────────────
def require_auth(request: Request):
    if not request.session.get("admin"):
        raise HTTPException(status_code=303, headers={"Location": "/admin/login"})


# ── Login ─────────────────────────────────────────────────
@app.get("/admin/login", response_class=HTMLResponse)
async def login_get(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error": None})


@app.post("/admin/login")
async def login_post(request: Request, password: str = Form(...)):
    if secrets.compare_digest(password, ADMIN_PASSWORD):
        request.session["admin"] = True
        return RedirectResponse("/admin", status_code=303)
    return templates.TemplateResponse("login.html", {"request": request, "error": "Contraseña incorrecta"})


@app.get("/admin/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/admin/login", status_code=303)


# ── Dashboard ─────────────────────────────────────────────
@app.get("/admin", response_class=HTMLResponse)
async def dashboard(request: Request, _=Depends(require_auth)):
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        total_users   = db.query(User).count()
        active_subs   = db.query(Subscription).filter(
            Subscription.status == "active", Subscription.end_date > now
        ).count()
        pending_pay   = db.query(Payment).filter(Payment.status == "pending").count()
        total_signals = db.query(Signal).count()
        recent_signals = db.query(Signal).order_by(Signal.sent_at.desc()).limit(5).all()
        recent_users   = db.query(User).order_by(User.joined_at.desc()).limit(8).all()
    finally:
        db.close()

    return templates.TemplateResponse("dashboard.html", {
        "request":       request,
        "total_users":   total_users,
        "active_subs":   active_subs,
        "pending_pay":   pending_pay,
        "total_signals": total_signals,
        "recent_signals": recent_signals,
        "recent_users":  recent_users,
        "now":           now,
    })


# ── Pagos pendientes ──────────────────────────────────────
@app.get("/admin/payments", response_class=HTMLResponse)
async def payments_list(request: Request, status: str = "pending", _=Depends(require_auth)):
    db = SessionLocal()
    try:
        q = db.query(Payment)
        if status != "all":
            q = q.filter(Payment.status == status)
        payments = q.order_by(Payment.created_at.desc()).limit(50).all()
        users_map = {u.id: u for u in db.query(User).all()}
    finally:
        db.close()
    return templates.TemplateResponse("payments.html", {
        "request": request, "payments": payments, "users_map": users_map, "status": status
    })


@app.post("/admin/payments/{payment_id}/approve")
async def approve_payment(payment_id: int, request: Request, _=Depends(require_auth)):
    db = SessionLocal()
    try:
        p = db.query(Payment).filter(Payment.id == payment_id).first()
        if not p:
            raise HTTPException(404)
        p.status = "approved"
        p.reviewed_at = datetime.utcnow()
        now = datetime.utcnow()
        sub = Subscription(
            user_id=p.user_id, status="active", plan="monthly",
            amount=p.amount, start_date=now, end_date=now + timedelta(days=PLAN_DAYS)
        )
        db.add(sub)
        db.commit()
    finally:
        db.close()
    return RedirectResponse("/admin/payments", status_code=303)


@app.post("/admin/payments/{payment_id}/reject")
async def reject_payment(payment_id: int, request: Request, _=Depends(require_auth)):
    db = SessionLocal()
    try:
        p = db.query(Payment).filter(Payment.id == payment_id).first()
        if not p:
            raise HTTPException(404)
        p.status = "rejected"
        p.reviewed_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()
    return RedirectResponse("/admin/payments", status_code=303)


# ── Señal manual ──────────────────────────────────────────
@app.get("/admin/signal", response_class=HTMLResponse)
async def signal_form(request: Request, _=Depends(require_auth)):
    return templates.TemplateResponse("signal.html", {"request": request, "sent": False})


@app.post("/admin/signal", response_class=HTMLResponse)
async def signal_send(
    request: Request,
    content: str = Form(...),
    symbol: str = Form(""),
    signal_type: str = Form("manual"),
    _=Depends(require_auth),
):
    # Guardar en DB (el bot lo envía al canal desde el loop)
    db = SessionLocal()
    try:
        sig = Signal(
            symbol=symbol or None,
            signal_type=signal_type,
            content=content,
            source="manual",
        )
        db.add(sig)
        db.commit()
    finally:
        db.close()

    # Enviar al canal (cargamos el bot aquí dinámicamente)
    try:
        from aiogram import Bot
        from config import BOT_TOKEN, CHANNEL_ID
        bot = Bot(token=BOT_TOKEN)
        now = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
        msg = (
            f"📡 *SEÑAL MANUAL*\n"
            f"{'─'*30}\n"
            f"{content}\n"
            f"{'─'*30}\n"
            f"⏰ `{now} UTC`\n"
            f"⚠️ _No es asesoría financiera._"
        )
        await bot.send_message(CHANNEL_ID, msg, parse_mode="Markdown")
        await bot.session.close()
    except Exception as e:
        print(f"Error enviando al canal: {e}")

    return templates.TemplateResponse("signal.html", {"request": request, "sent": True})


# ── Historial señales ─────────────────────────────────────
@app.get("/admin/signals", response_class=HTMLResponse)
async def signals_list(request: Request, _=Depends(require_auth)):
    db = SessionLocal()
    try:
        sigs = db.query(Signal).order_by(Signal.sent_at.desc()).limit(50).all()
    finally:
        db.close()
    return templates.TemplateResponse("signals_list.html", {"request": request, "signals": sigs})


# ── Health check (para Railway) ───────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


# ══════════════════════════════════════════════════════════
# TRADINGVIEW WEBHOOK
# URL para configurar en TradingView:
#   https://TU_DOMINIO.railway.app/webhook/tradingview?secret=TU_SECRETO
#
# Formato JSON recomendado en el mensaje de la alerta TradingView:
# {
#   "secret":   "TU_SECRETO",
#   "symbol":   "{{ticker}}",
#   "action":   "BUY",
#   "price":    {{close}},
#   "interval": "{{interval}}",
#   "exchange": "{{exchange}}",
#   "message":  "Descripción de la alerta"
# }
# ══════════════════════════════════════════════════════════
@app.post("/webhook/tradingview")
async def tradingview_webhook(request: Request, secret: str = ""):
    from config import TV_WEBHOOK_ENABLED, TV_WEBHOOK_SECRET
    from signals.tradingview import parse_payload, build_telegram_message

    # ── Verificar que webhooks están habilitados ───────────
    if not TV_WEBHOOK_ENABLED:
        return {"status": "disabled", "message": "Webhook no configurado. Agrega TV_WEBHOOK_SECRET en .env"}

    # ── Verificar secreto (en URL ?secret=... o en body) ──
    body_raw = await request.body()
    body_text = body_raw.decode("utf-8", errors="replace")

    # Intentar parsear para obtener el secret del body también
    import json as _json
    body_data: dict = {}
    try:
        body_data = _json.loads(body_text)
    except Exception:
        pass

    secret_from_body = body_data.get("secret", "") if body_data else ""
    received_secret  = secret or secret_from_body

    if not secrets.compare_digest(received_secret, TV_WEBHOOK_SECRET):
        raise HTTPException(status_code=403, detail="Secreto inválido")

    # ── Parsear payload ────────────────────────────────────
    payload = parse_payload(body_data if body_data else body_text)
    if not payload:
        raise HTTPException(status_code=400, detail="Payload no reconocido")

    # ── Enviar señal al canal ──────────────────────────────
    msg = build_telegram_message(payload)
    try:
        from aiogram import Bot
        from config import BOT_TOKEN, CHANNEL_ID
        bot = Bot(token=BOT_TOKEN)
        await bot.send_message(CHANNEL_ID, msg, parse_mode="Markdown")
        await bot.session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando al canal: {e}")

    # ── Guardar en DB ──────────────────────────────────────
    db = SessionLocal()
    try:
        sig = Signal(
            symbol      = payload.get("symbol") or None,
            signal_type = payload.get("action", "ALERT"),
            timeframe   = payload.get("interval") or None,
            content     = msg,
            source      = "tradingview",
        )
        db.add(sig)
        db.commit()
    finally:
        db.close()

    return {"status": "ok", "action": payload.get("action"), "symbol": payload.get("symbol")}


# ── Página de configuración del webhook TradingView (admin) ──
@app.get("/admin/webhook", response_class=HTMLResponse)
async def webhook_info(request: Request, _=Depends(require_auth)):
    from config import TV_WEBHOOK_ENABLED, TV_WEBHOOK_SECRET
    base_url = str(request.base_url).rstrip("/")
    webhook_url = f"{base_url}/webhook/tradingview?secret={TV_WEBHOOK_SECRET}" if TV_WEBHOOK_ENABLED else ""
    return templates.TemplateResponse("webhook.html", {
        "request": request,
        "enabled": TV_WEBHOOK_ENABLED,
        "webhook_url": webhook_url,
    })


@app.post("/admin/webhook/test")
async def webhook_test(
    request: Request,
    action: str = Form("BUY"),
    symbol: str = Form("BTCUSDT"),
    price: str = Form(""),
    _=Depends(require_auth),
):
    from signals.tradingview import build_telegram_message
    payload = {
        "action": action,
        "symbol": symbol,
        "price": price or "—",
        "interval": "4h",
        "exchange": "BINANCE",
        "message": "🧪 Prueba de webhook desde el panel admin",
    }
    msg = build_telegram_message(payload)
    try:
        from aiogram import Bot
        from config import BOT_TOKEN, CHANNEL_ID
        bot = Bot(token=BOT_TOKEN)
        await bot.send_message(CHANNEL_ID, msg, parse_mode="Markdown")
        await bot.session.close()

        db = SessionLocal()
        try:
            sig = Signal(
                symbol=symbol or None,
                signal_type=action,
                content=msg,
                source="tradingview",
            )
            db.add(sig)
            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"Error en prueba webhook: {e}")
    return RedirectResponse("/admin/webhook", status_code=303)
