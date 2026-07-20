import { getAuth, isAdmin } from "@/lib/auth";
import type { Level } from "./data/modules";

// ─── Candado por nivel del Aula Virtual ────────────────────────────────────
// (julio 20 2026 — antes esto no existía: cualquiera que entrara a /aula con
// CUALQUIER plan (hasta Básico $9) veía y podía abrir TODOS los módulos,
// incluyendo los de nivel Elite $99. El Dashboard prometía Básico=N1-N3,
// Educación=N1-N5, Elite=N1-N8("TOTAL") pero nada lo hacía cumplir.
//
// Reglas confirmadas por Jorge:
// - Básico   → solo su propio nivel (N1-N3)
// - Educación → N1-N5
// - Pro      → "ambos" (básico + educación) → mismo techo que Educación (N1-N5)
// - Elite    → los 3 niveles abiertos → todo (N1-N7, no hay N8 real en los datos)
const BASICO_LEVELS: Level[] = ["N1", "N2", "N3"];
const EDUCACION_LEVELS: Level[] = ["N1", "N2", "N3", "N4", "N5"];
const ELITE_LEVELS: Level[] = ["N1", "N2", "N3", "N4", "N5", "N6", "N7"];

export function getAllowedAulaLevels(): Level[] {
  const auth = getAuth();
  if (!auth) return [];
  if (isAdmin(auth)) return ELITE_LEVELS;

  const plan = (auth.plan ?? "").toLowerCase();
  switch (plan) {
    case "elite":
    case "institucional":
      return ELITE_LEVELS;
    case "pro":
    case "trader":
    case "educacion":
      return EDUCACION_LEVELS;
    case "basico":
    case "aprendiz":
      return BASICO_LEVELS;
    default:
      return []; // exchange u otro plan sin acceso al Aula
  }
}

export function isLevelLocked(level: Level, allowedLevels: Level[]): boolean {
  return !allowedLevels.includes(level);
}

// Próximo plan a ofrecer para desbloquear un nivel dado (para el mensaje de upsell)
export function nextPlanForLevel(level: Level): { plan: string; price: string } {
  if (EDUCACION_LEVELS.includes(level)) return { plan: "Educación", price: "$29/mes" };
  return { plan: "Elite", price: "$99/mes" };
}
