import { shieldRead } from "@/lib/secure-storage";

export type PlanLevel = "exchange" | "basico" | "educacion" | "pro" | "elite" | "aprendiz" | "trader" | "institucional";

export interface AuthSession {
  user: string;
  displayName?: string;
  role: string;
  plan?: string;
  token: string;
  ts: number;
}

// DB plan names map to the same rank as old plan names
// exchange = rank 0.5 (solo Exchange + Wallet)
// aprendiz = basico (rank 1)
// trader   = pro    (rank 3)
// institucional = elite (rank 4)
export const PLAN_RANK: Record<string, number> = {
  exchange: 0.5,
  basico: 1, básico: 1,
  aprendiz: 1,
  educacion: 2, educación: 2,
  pro: 3,
  trader: 3,
  elite: 4,
  institucional: 4,
};

export const PLAN_COLORS: Record<string, string> = {
  exchange: "#4a6070",
  basico: "#00e676",
  aprendiz: "#00e676",
  educacion: "#ffd700",
  pro: "#e040fb",
  trader: "#e040fb",
  elite: "#00e5ff",
  institucional: "#00e5ff",
};

export const PLAN_PRICES: Record<string, string> = {
  basico: "$9/mes",
  aprendiz: "$5/mes",
  educacion: "$29/mes",
  pro: "$49/mes",
  trader: "$49/mes",
  elite: "$99/mes",
  institucional: "$99/mes",
};

export const PLAN_NAMES: Record<string, string> = {
  exchange: "EXCHANGE FREE",
  basico: "BÁSICO",
  aprendiz: "APRENDIZ",
  educacion: "EDUCACIÓN",
  pro: "PRO",
  trader: "TRADER",
  elite: "ELITE",
  institucional: "INSTITUCIONAL",
};

export function getAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return null;

    // Estrategia 1: JSON plano (formato nuevo — más robusto)
    try {
      const s = JSON.parse(raw) as AuthSession;
      if (s.user && s.role) {
        if (Date.now() - (s.ts ?? 0) > 8 * 60 * 60 * 1000) {
          localStorage.removeItem("psyko_auth");
          return null;
        }
        return s;
      }
    } catch { /* no es JSON plano, probar decodificación */ }

    // Estrategia 2: XOR + Base64 (formato antiguo — compatibilidad)
    try {
      const plaintext = shieldRead(raw);
      const s = JSON.parse(plaintext) as AuthSession;
      if (s.user && s.role) {
        if (Date.now() - (s.ts ?? 0) > 8 * 60 * 60 * 1000) {
          localStorage.removeItem("psyko_auth");
          return null;
        }
        // Migrar a formato nuevo silenciosamente
        localStorage.setItem("psyko_auth", JSON.stringify(s));
        return s;
      }
    } catch { /* tampoco funciona */ }

    return null;
  } catch { return null; }
}

export function getRank(plan: string): number {
  return PLAN_RANK[plan?.toLowerCase()] ?? 0;
}

export function isAdmin(auth: AuthSession | null): boolean {
  return auth?.role === "superadmin";
}

export function hasAccess(auth: AuthSession | null, required: PlanLevel): boolean {
  if (!auth) return false;
  if (isAdmin(auth)) return true;
  // Exchange-only users can only access "exchange" level routes
  if (auth.plan === "exchange") return getRank("exchange") >= getRank(required);
  if (auth.role === "member") return getRank(auth.plan ?? "basico") >= getRank(required);
  return getRank(auth.plan ?? "") >= getRank(required);
}

export function isExchangeUser(auth: AuthSession | null): boolean {
  return auth?.plan === "exchange";
}

export function logout(): void {
  localStorage.removeItem("psyko_auth");
  window.location.replace("/login");
}
