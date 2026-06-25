import { Router, type Request, type Response } from "express";
import { db, psyApiKeys } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { validateToken } from "../lib/psy-auth";

const router = Router();

async function checkAdmin(req: Request): Promise<boolean> {
  const tokenAuth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  return tokenAuth.role === "superadmin";
}

function generateKey(): string {
  return "PSY_" + randomBytes(20).toString("hex");
}

// ── GET /api/developer/key?u=username  (dashboard self-service, masked) ──────
router.get("/developer/key", async (req: Request, res: Response) => {
  const u = (req.query.u as string | undefined)?.trim().toLowerCase();
  if (!u) { res.status(400).json({ error: "username required" }); return; }

  try {
    const rows = await db
      .select()
      .from(psyApiKeys)
      .where(eq(psyApiKeys.username, u))
      .limit(1);

    if (!rows[0]) { res.json({ found: false }); return; }

    const k = rows[0];
    const masked = k.key.slice(0, 8) + "••••••••••••••••••••••••••••" + k.key.slice(-6);
    res.json({
      found: true,
      active: k.active,
      masked,
      label: k.label,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
    });
  } catch (err) {
    req.log.error({ err }, "api-keys get error");
    res.status(500).json({ error: "DB error" });
  }
});

// ── GET /api/developer/fullkey?u=username  (reveals full key, same session) ──
router.get("/developer/fullkey", async (req: Request, res: Response) => {
  const u = (req.query.u as string | undefined)?.trim().toLowerCase();
  if (!u) { res.status(400).json({ error: "username required" }); return; }

  try {
    const rows = await db.select().from(psyApiKeys).where(eq(psyApiKeys.username, u)).limit(1);
    if (!rows[0]) { res.json({ found: false }); return; }
    if (!rows[0].active) { res.status(403).json({ error: "Key inactiva — contactá al admin" }); return; }
    res.json({ key: rows[0].key });
  } catch (err) {
    req.log.error({ err }, "api-keys fullkey error");
    res.status(500).json({ error: "DB error" });
  }
});

// ── GET /api/admin/developer/keys  (list all — admin) ────────────────────────
router.get("/admin/developer/keys", async (req: Request, res: Response) => {
  if (!await checkAdmin(req)) { res.status(403).json({ error: "Unauthorized" }); return; }
  try {
    const rows = await db.select().from(psyApiKeys).orderBy(desc(psyApiKeys.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "api-keys list error");
    res.status(500).json({ error: "DB error" });
  }
});

// ── POST /api/admin/developer/keys  (create key — admin) ─────────────────────
router.post("/admin/developer/keys", async (req: Request, res: Response) => {
  if (!await checkAdmin(req)) { res.status(403).json({ error: "Unauthorized" }); return; }
  const { username, label } = req.body as { username?: string; label?: string };
  if (!username) { res.status(400).json({ error: "username required" }); return; }

  try {
    // Remove existing key for same user before creating new one
    await db.delete(psyApiKeys).where(eq(psyApiKeys.username, username.toLowerCase().trim()));

    const key = generateKey();
    const [row] = await db.insert(psyApiKeys).values({
      key,
      username: username.toLowerCase().trim(),
      label: label ?? "API Developer",
      active: false,
    }).returning();
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "api-keys create error");
    res.status(500).json({ error: "DB error" });
  }
});

// ── POST /api/admin/developer/keys/:key/activate  ────────────────────────────
router.post("/admin/developer/keys/:key/activate", async (req: Request, res: Response) => {
  if (!await checkAdmin(req)) { res.status(403).json({ error: "Unauthorized" }); return; }
  const key = req.params["key"] as string;
  const { active, expiresAt } = req.body as { active?: boolean; expiresAt?: string };
  try {
    const [row] = await db.update(psyApiKeys)
      .set({
        active: active ?? true,
        ...(active !== false ? { activatedAt: new Date() } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      })
      .where(eq(psyApiKeys.key, key))
      .returning();
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "api-keys activate error");
    res.status(500).json({ error: "DB error" });
  }
});

// ── POST /api/admin/developer/keys/:key/deactivate ───────────────────────────
router.post("/admin/developer/keys/:key/deactivate", async (req: Request, res: Response) => {
  if (!await checkAdmin(req)) { res.status(403).json({ error: "Unauthorized" }); return; }
  const key = req.params["key"] as string;
  try {
    const [row] = await db.update(psyApiKeys)
      .set({ active: false })
      .where(eq(psyApiKeys.key, key))
      .returning();
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "api-keys deactivate error");
    res.status(500).json({ error: "DB error" });
  }
});

// ── DELETE /api/admin/developer/keys/:key ─────────────────────────────────────
router.delete("/admin/developer/keys/:key", async (req: Request, res: Response) => {
  if (!await checkAdmin(req)) { res.status(403).json({ error: "Unauthorized" }); return; }
  const key = req.params["key"] as string;
  try {
    await db.delete(psyApiKeys).where(eq(psyApiKeys.key, key));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "api-keys delete error");
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
