import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { apiConfigTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { validateToken } from "../lib/psy-auth";

const ADMIN_PASSWORD = process.env["SUPERADMIN_PASSWORD"];
if (!ADMIN_PASSWORD) throw new Error("SUPERADMIN_PASSWORD must be set as an environment variable");

const router = Router();

// All defined API keys the platform needs
const KNOWN_KEYS = [
  {
    keyName: "GEMINI_API_KEY",
    label: "Gemini API Key",
    category: "IA",
    purpose: "PSY Chat — Asistente de trading con IA",
    url: "https://aistudio.google.com/app/apikey",
    required: true,
    autoConfigured: false,
  },
  {
    keyName: "ANTHROPIC",
    label: "Claude API Key (Anthropic)",
    category: "IA",
    purpose: "PSY Autopsy + Reporte Semanal IA",
    url: "https://console.anthropic.com/",
    required: true,
    autoConfigured: false,
  },
  {
    keyName: "TELEGRAM_BOT_TOKEN",
    label: "Telegram Bot Token",
    category: "Notificaciones",
    purpose: "Envío de señales automáticas al canal de Telegram",
    url: "https://t.me/BotFather",
    required: true,
    autoConfigured: false,
  },
  {
    keyName: "TELEGRAM_CHANNEL_ID",
    label: "Telegram Channel ID",
    category: "Notificaciones",
    purpose: "Canal donde se publican las señales (ej: @psychometriks_pro)",
    url: "https://t.me/BotFather",
    required: true,
    autoConfigured: false,
  },
  {
    keyName: "ONEINCH_API_KEY",
    label: "1inch API Key",
    category: "PSY Wallet",
    purpose: "Cotizaciones y rutas de swap en PSY Wallet",
    url: "https://portal.1inch.dev/",
    required: false,
    autoConfigured: false,
    note: "Opcional — sin key usa cotizaciones aproximadas",
  },
  {
    keyName: "COINGECKO_API_KEY",
    label: "CoinGecko API Key",
    category: "Precios",
    purpose: "Precios en tiempo real con mayor rate limit",
    url: "https://www.coingecko.com/en/api",
    required: false,
    autoConfigured: false,
    note: "Opcional — funciona sin key con límites básicos",
  },
  {
    keyName: "ETHERSCAN_API_KEY",
    label: "Etherscan API Key",
    category: "PSY Wallet",
    purpose: "Historial de transacciones on-chain (Ethereum)",
    url: "https://etherscan.io/myapikey",
    required: false,
    autoConfigured: false,
  },
  {
    keyName: "MORALIS_API_KEY",
    label: "Moralis API Key",
    category: "PSY Wallet",
    purpose: "Datos on-chain multi-chain (BSC, Arbitrum, Polygon)",
    url: "https://admin.moralis.io/",
    required: false,
    autoConfigured: false,
  },
  {
    keyName: "BSCSCAN_API_KEY",
    label: "BSCScan API Key",
    category: "PSY Wallet",
    purpose: "Historial de transacciones on-chain (BNB Chain)",
    url: "https://bscscan.com/myapikey",
    required: false,
    autoConfigured: false,
  },
  {
    keyName: "NVIDIA_API_KEY",
    label: "NVIDIA API Key",
    category: "IA",
    purpose: "Modelos de IA avanzados NVIDIA NIM",
    url: "https://build.nvidia.com/",
    required: false,
    autoConfigured: false,
    note: "Para funciones futuras de análisis de gráficos con IA",
  },
  {
    keyName: "SESSION_SECRET",
    label: "Session Secret",
    category: "Seguridad",
    purpose: "Cifrado de sesiones de usuario",
    url: "",
    required: true,
    autoConfigured: true,
    note: "Generado automáticamente al iniciar el proyecto",
  },
  {
    keyName: "PSY_FEE_WALLET",
    label: "Wallet de Fees PSY",
    category: "PSY Wallet",
    purpose: "Dirección donde se acumulan los fees del 0.5% de cada swap",
    url: "",
    required: false,
    autoConfigured: false,
    note: "Ej: 0xTuDirecciónEthereum",
  },
  {
    keyName: "ZEROX_API_KEY",
    label: "0x Protocol API Key",
    category: "PSY Exchange",
    purpose: "Cotizaciones reales y swaps via 0x — PSY Exchange DEX Aggregator",
    url: "https://dashboard.0x.org/",
    required: true,
    autoConfigured: false,
    note: "Registrate en dashboard.0x.org con plan Standard DEX",
  },
];

// GET /api/admin/config — status of all keys
router.get("/admin/config", async (req: Request, res: Response) => {
  try {
    // Load saved keys from DB
    const saved = await db.select().from(apiConfigTable);
    const savedMap: Record<string, string> = {};
    for (const row of saved) savedMap[row.keyName] = row.keyValue;

    const result = KNOWN_KEYS.map(k => {
      const envSet = !!process.env[k.keyName];
      const dbSet  = !!savedMap[k.keyName];
      return {
        ...k,
        configured: k.autoConfigured || envSet || dbSet,
        source: k.autoConfigured ? "auto" : envSet ? "env" : dbSet ? "db" : "none",
        maskedValue: dbSet ? maskValue(savedMap[k.keyName]) : envSet ? "***env***" : null,
      };
    });

    res.json({ keys: result });
  } catch (err) {
    req.log.error({ err }, "admin-config GET error");
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/admin/config — save a key to DB
router.post("/admin/config", async (req: Request, res: Response) => {
  const { keyName, keyValue, adminPassword } = req.body as { keyName: string; keyValue: string; adminPassword?: string };
  const tokenAuth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  const isAuthorized = tokenAuth.role === "superadmin" || adminPassword === ADMIN_PASSWORD;

  if (!isAuthorized) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  if (!keyName || !keyValue) {
    res.status(400).json({ error: "keyName y keyValue son requeridos" });
    return;
  }

  try {
    await db.insert(apiConfigTable)
      .values({ keyName, keyValue, description: keyName, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: apiConfigTable.keyName,
        set: { keyValue, updatedAt: new Date() },
      });

    req.log.info({ keyName }, "API config updated");
    res.json({ success: true, message: `${keyName} guardado correctamente` });
  } catch (err) {
    req.log.error({ err }, "admin-config POST error");
    res.status(500).json({ error: "Error guardando la clave" });
  }
});

// DELETE /api/admin/config/:keyName
router.delete("/admin/config/:keyName", async (req: Request, res: Response) => {
  const { adminPassword } = req.body as { adminPassword?: string };
  const tokenAuth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  const isAuthorized = tokenAuth.role === "superadmin" || adminPassword === ADMIN_PASSWORD;

  if (!isAuthorized) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const { keyName } = req.params;
  try {
    await db.delete(apiConfigTable).where(sql`${apiConfigTable.keyName} = ${keyName}`);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "admin-config DELETE error");
    res.status(500).json({ error: "Error eliminando la clave" });
  }
});

function maskValue(v: string): string {
  if (v.length <= 8) return "****";
  return v.slice(0, 4) + "****" + v.slice(-4);
}

export default router;
