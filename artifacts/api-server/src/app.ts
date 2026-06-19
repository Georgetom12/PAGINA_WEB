import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { createHmac, timingSafeEqual } from "crypto";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers — Helmet ──────────────────────────────────────────────
// API pura (sin HTML) — desactivamos CSP que aplica solo a páginas web.
// El resto de headers sí aplican: X-Content-Type-Options, X-Frame-Options,
// HSTS, X-XSS-Protection (desactivado por ser recomendación moderna), etc.
app.use(
  helmet({
    contentSecurityPolicy:       false, // API-only — no sirve HTML
    crossOriginEmbedderPolicy:   false,
    crossOriginResourcePolicy:   { policy: "cross-origin" },
  }),
);

// ── CORS — whitelist estricta ──────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://psychometriks.trade",
  "https://www.psychometriks.trade",
];
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin || // mismo origen / curl
        ALLOWED_ORIGINS.includes(origin) ||
        /\.(railway\.app)$/.test(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin no permitido — ${origin}`));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-PSY-Token", "X-PSY-Sig", "X-PSY-Ts"],
  }),
);

// ── Rate limiting — auth endpoints (10 intentos / 15 min / IP) ────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Esperá 15 minutos antes de reintentar." },
});

// ── Rate limiting — superadmin login (5 intentos / 15 min / IP) ───────────
const superadminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de admin. Bloqueado 15 minutos." },
});

// ── Rate limiting — password reset/forgot (3 req / 15 min / IP) ───────────
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de reseteo. Esperá 15 minutos." },
});

// ── Rate limiting — AI endpoints (20 req / min / IP) ──────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de consultas IA alcanzado. Esperá 1 minuto." },
});

// ── Worker HMAC verification (soft — verifica si está presente, no bloquea si falta) ──
// Firmamos: HMAC-SHA256(timestamp, PSY_WORKER_SECRET)
// Ventana de validez: 5 minutos (previene replay attacks).
// Si PSY_WORKER_SECRET no está configurado en Railway, se omite silenciosamente.
const WORKER_SECRET = process.env["PSY_WORKER_SECRET"];

function verifyWorkerHmac(req: Request, _res: Response, next: NextFunction): void {
  const sig = req.headers["x-psy-sig"] as string | undefined;
  const ts  = req.headers["x-psy-ts"]  as string | undefined;

  if (sig && ts && WORKER_SECRET) {
    try {
      const age = Date.now() - parseInt(ts, 10);
      if (age >= 0 && age <= 5 * 60 * 1000) {
        const expected = createHmac("sha256", WORKER_SECRET).update(ts).digest("hex");
        // Padding defensivo para que timingSafeEqual no lance por longitudes distintas
        const sigPadded = sig.slice(0, expected.length).padEnd(expected.length, "\0");
        const expPadded = expected.padEnd(expected.length, "\0");
        if (timingSafeEqual(Buffer.from(sigPadded), Buffer.from(expPadded))) {
          (req as Request & { psyWorkerVerified?: boolean }).psyWorkerVerified = true;
        }
      }
    } catch { /* HMAC inválido — no bloqueamos en modo soft */ }
  }
  next();
}

// ── Logging ────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Middlewares base ───────────────────────────────────────────────────────
app.use(cookieParser());
app.use(verifyWorkerHmac);
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// ── Cookie → Header bridge (R1) ───────────────────────────────────────────
// Si el cliente tiene una cookie httpOnly psy_session pero no envía X-PSY-Token,
// la copiamos al header para que todos los route handlers existentes sigan
// funcionando sin cambios. Doble protección: cookie + header.
app.use((req: Request, _res: Response, next: NextFunction): void => {
  if (!req.headers["x-psy-token"] && req.cookies?.["psy_session"]) {
    req.headers["x-psy-token"] = req.cookies["psy_session"] as string;
  }
  next();
});

// ── CSRF — Verificación explícita de Origin en requests de escritura ─────────
// CORS devuelve headers, pero no RECHAZA el request si el Origin es incorrecto.
// Este middleware sí rechaza, siendo una defensa CSRF de segunda capa.
// Requests sin Origin (curl, server-to-server, mismo origen) pasan sin restricción.
app.use((req: Request, res: Response, next: NextFunction): void => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") { next(); return; }
  const origin = req.headers["origin"] as string | undefined;
  if (!origin) { next(); return; } // mismo origen o llamada server-to-server
  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /\.(railway\.app)$/.test(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
  if (!allowed) {
    res.status(403).json({ error: "CSRF: origen no autorizado — solicitud bloqueada" });
    return;
  }
  next();
});

// ── Rate limiters por ruta ─────────────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api/auth/superadmin-login",     superadminLimiter);
app.use("/api/auth/superadmin-totp-verify", superadminLimiter);
app.use("/api/auth/forgot-password",      forgotLimiter);
app.use("/api/auth/reset-password",       forgotLimiter);
app.use("/api/psy-oracle", aiLimiter);
app.use("/api/psy-chat", aiLimiter);
app.use("/api/chat", aiLimiter);

// ── Rutas ──────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
