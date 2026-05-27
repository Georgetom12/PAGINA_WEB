/**
 * ORACLE PROXY — puente entre @workspace/api-server (pagina web)
 * y ORECLA FEEDS (psychometriks-oracle-feeds-production.up.railway.app).
 *
 * Rutas aquí no definidas localmente se reenvían al servicio ORECLA FEEDS.
 * No modifica ninguna ruta existente.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

const ORACLE_FEEDS_URL =
  process.env.ORACLE_FEEDS_URL ||
  "https://psychometriks-oracle-feeds-production.up.railway.app";

const PROXY_PREFIXES = [
  "/api/buffett",
  "/api/proxy/fmp",
  "/api/proxy/polygon",
  "/api/scan",
];

async function forwardRequest(req: Request, res: Response): Promise<void> {
  const target = `${ORACLE_FEEDS_URL}${req.originalUrl}`;

  try {
    const headers: Record<string, string> = {
      "content-type": req.headers["content-type"] || "application/json",
    };
    if (req.headers.authorization) {
      headers["authorization"] = req.headers.authorization;
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(target, init);
    const contentType = upstream.headers.get("content-type") || "";

    res.status(upstream.status);
    res.setHeader("content-type", contentType);

    if (contentType.includes("application/json")) {
      const json = await upstream.json();
      res.json(json);
    } else {
      const text = await upstream.text();
      res.send(text);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: "oracle_proxy_error",
      message,
      target,
    });
  }
}

router.use((req, res, next) => {
  const shouldProxy = PROXY_PREFIXES.some((p) => req.originalUrl.startsWith(p));
  if (shouldProxy) {
    forwardRequest(req, res);
  } else {
    next();
  }
});

export default router;
