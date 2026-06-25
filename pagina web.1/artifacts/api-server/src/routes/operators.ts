import { Router, type IRouter, type Request, type Response } from "express";
import { db, operators } from "@workspace/db";
import { eq } from "drizzle-orm";
import { validateToken, hashPassword, verifyPassword } from "../lib/psy-auth";
import { signJwt } from "../lib/jwt";

const IS_PROD = process.env["NODE_ENV"] === "production";

function setSessionCookie(res: Response, token: string): void {
  res.cookie("psy_session", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    path: "/api",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

const router: IRouter = Router();

// ── POST /api/auth/operator-login ─────────────────────────────────────────
// Validates operator credentials and returns a token + role info.
router.post("/auth/operator-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }

  // Check for superadmin first (password from env var — no hardcoded fallback)
  const SA_PWD = process.env["SUPERADMIN_PASSWORD"];
  if (SA_PWD && username.toLowerCase() === "admin" && password === SA_PWD) {
    const token = signJwt({ sub: "admin", role: "superadmin", plan: "elite" });
    setSessionCookie(res, token);
    res.json({ ok: true, role: "superadmin", username: "admin", token });
    return;
  }

  try {
    const [op] = await db
      .select()
      .from(operators)
      .where(eq(operators.username, username.toLowerCase()))
      .limit(1);

    const valid = op && op.active && await verifyPassword(password, op.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Credenciales incorrectas o acceso revocado" });
      return;
    }

    // Auto-upgrade legacy SHA-256 → bcrypt silently in background
    if (!op.passwordHash.startsWith("$2b$") && !op.passwordHash.startsWith("$2a$")) {
      hashPassword(password).then(newHash =>
        db.update(operators).set({ passwordHash: newHash }).where(eq(operators.id, op.id))
      ).catch(() => {});
    }

    const token = signJwt({ sub: op.username, role: "operator" });
    setSessionCookie(res, token);
    res.json({ ok: true, role: "operator", username: op.username, displayName: op.displayName, token });
  } catch (err) {
    req.log.error({ err }, "operator login error");
    res.status(500).json({ error: "Error en autenticación" });
  }
});

// ── GET /api/admin/operators ──────────────────────────────────────────────
router.get("/admin/operators", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") {
    res.status(403).json({ error: "Acceso denegado — solo SUPERADMIN" });
    return;
  }
  try {
    const rows = await db.select({
      id: operators.id,
      username: operators.username,
      displayName: operators.displayName,
      active: operators.active,
      createdBy: operators.createdBy,
      createdAt: operators.createdAt,
    }).from(operators).orderBy(operators.createdAt);
    res.json({ ok: true, operators: rows });
  } catch (err) {
    req.log.error({ err }, "operators fetch error");
    res.status(500).json({ error: "Error al obtener operadores" });
  }
});

// ── POST /api/admin/operators ─────────────────────────────────────────────
router.post("/admin/operators", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") {
    res.status(403).json({ error: "Acceso denegado — solo SUPERADMIN" });
    return;
  }

  const { username, password, displayName } = req.body as {
    username?: string; password?: string; displayName?: string;
  };
  if (!username || !password || !displayName) {
    res.status(400).json({ error: "username, password y displayName son requeridos" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const [op] = await db.insert(operators).values({
      username: username.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
      active: true,
      createdBy: "admin",
    }).returning();
    res.json({ ok: true, operator: { id: op.id, username: op.username, displayName: op.displayName, active: op.active } });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      res.status(400).json({ error: "Ese nombre de usuario ya existe" });
      return;
    }
    req.log.error({ err }, "operator create error");
    res.status(500).json({ error: "Error al crear operador" });
  }
});

// ── PATCH /api/admin/operators/:id ────────────────────────────────────────
// Toggle active status or update password
router.patch("/admin/operators/:id", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") {
    res.status(403).json({ error: "Acceso denegado — solo SUPERADMIN" });
    return;
  }

  const id = Number(req.params["id"]);
  const { active, password } = req.body as { active?: boolean; password?: string };

  try {
    const updates: Partial<{ active: boolean; passwordHash: string }> = {};
    if (active !== undefined) updates.active = active;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        return;
      }
      updates.passwordHash = await hashPassword(password);
    }
    await db.update(operators).set(updates).where(eq(operators.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "operator update error");
    res.status(500).json({ error: "Error al actualizar operador" });
  }
});

// ── DELETE /api/admin/operators/:id ──────────────────────────────────────
router.delete("/admin/operators/:id", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") {
    res.status(403).json({ error: "Acceso denegado — solo SUPERADMIN" });
    return;
  }
  const id = Number(req.params["id"]);
  try {
    await db.delete(operators).where(eq(operators.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "operator delete error");
    res.status(500).json({ error: "Error al eliminar operador" });
  }
});

export default router;
