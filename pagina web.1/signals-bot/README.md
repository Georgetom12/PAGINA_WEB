# 📡 Señales VIP Crypto Bot

Bot de Telegram para señales de trading con panel de administración web.

## Características

- 🤖 Bot de Telegram con membresía $5/mes
- 💳 Pagos manuales: PayPal, Binance Pay, Transferencia bancaria
- 📊 Señales automáticas: RSI, EMA, CVD, Open Interest, Volumen, S/R, Ciclo macro
- 🌐 Panel web de admin para aprobar pagos y enviar señales manuales
- 🚀 Deploy en Railway con PostgreSQL

---

## Instalación rápida

### 1. Clonar y configurar
```bash
git clone TU_REPO
cd signals-bot
cp .env.example .env
# Edita .env con tus datos
```

### 2. Obtener el ID del canal
1. Crea un canal privado en Telegram
2. Agrega tu bot como **administrador** del canal
3. Agrega @userinfobot al canal, te dirá el ID (número negativo)
4. Pon ese ID en `CHANNEL_ID` del .env

### 3. Deploy en Railway

1. Sube el proyecto a GitHub
2. En railway.app → New Project → Deploy from GitHub
3. Agrega PostgreSQL: Add Service → Database → PostgreSQL
4. En Variables de entorno pega todos los valores de tu `.env`
5. Railway asigna `DATABASE_URL` automáticamente
6. Deploy automático ✅

### 4. Panel admin

Accede a: `https://TU_DOMINIO.railway.app/admin`  
Contraseña: la que pusiste en `ADMIN_PASSWORD`

---

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `BOT_TOKEN` | Token de @BotFather |
| `CHANNEL_ID` | ID del canal privado (negativo) |
| `ADMIN_IDS` | Tu Telegram ID |
| `PAYPAL_EMAIL` | Email de PayPal |
| `BINANCE_PAY_ID` | ID de Binance Pay |
| `BANK_INFO` | Datos bancarios |
| `ADMIN_PASSWORD` | Clave del panel web |
| `SECRET_KEY` | Cadena aleatoria para sesiones |
| `DATABASE_URL` | Railway lo pone automático |

---

## Comandos del bot (admin)

| Comando | Función |
|---------|---------|
| `/admin` | Panel resumen |
| `/pending` | Ver pagos pendientes |
| `/members` | Ver miembros activos |
| `/signal <texto>` | Enviar señal manual |
| `/kick <telegram_id>` | Remover miembro del canal |

---

## Señales automáticas

El motor analiza cada 15 minutos:
- **RSI** sobrecompra/sobreventa
- **EMA** 9/21/50/200 y cruces golden/death cross
- **CVD** delta de volumen acumulado
- **Open Interest** cambios en contratos abiertos
- **Volumen** vs promedio 20 períodos
- **Soporte/Resistencia** pivot points
- **Ciclo macro BTC** posición en el ciclo de 4 años (halvings)

Solo envía señal cuando detecta confluencia (score ≥ 2 o ≤ -2).

---

⚠️ **Aviso legal:** Las señales son informativas. No constituyen asesoría financiera.
