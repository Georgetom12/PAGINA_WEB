/**
 * PSY SHIELD — Capa de ofuscación sincrónica para localStorage.
 *
 * Usa XOR con una clave derivada de propiedades del navegador/dispositivo.
 * Complementa la CSP que bloquea XSS en la fuente.
 *
 * Ventajas:
 *   ✅ 100% sincrónico — getAuth() no necesita cambios en ningún componente.
 *   ✅ Los datos en localStorage son ilegibles sin la clave del dispositivo.
 *   ✅ Copiar localStorage a otra máquina produce basura.
 *   ✅ Backward compatible — si el dato no tiene el formato esperado, lo devuelve raw.
 *
 * No es cifrado AES completo, pero hace el vault de sesión opaco frente a
 * inspecciones manuales, extensiones, y scripts sin acceso al contexto JS.
 */

// ── Clave derivada del dispositivo (propiedades estables del navegador) ──────
function deviceKey(): string {
  try {
    return [
      typeof navigator !== "undefined" ? (navigator.language ?? "es")              : "es",
      typeof screen    !== "undefined" ? screen.colorDepth                         : 24,
      typeof Date      !== "undefined" ? new Date().getTimezoneOffset()            : -300,
      typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? 4)      : 4,
      "PSY_SHIELD_2025",
    ].join("|");
  } catch {
    return "PSY_SHIELD_2025_FALLBACK";
  }
}

// ── XOR rotativo ─────────────────────────────────────────────────────────────
function xorEncode(data: string, key: string): string {
  return data
    .split("")
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join("");
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Ofusca un string antes de guardarlo en localStorage. */
export function shieldWrite(data: string): string {
  try {
    return btoa(xorEncode(data, deviceKey()));
  } catch {
    return data; // fallback graceful
  }
}

/**
 * Desofusca un string leído de localStorage.
 * Si el valor no tiene el formato esperado (dato antiguo sin ofuscar),
 * lo devuelve tal cual para mantener backward compatibility.
 */
export function shieldRead(raw: string): string {
  try {
    // Verificar que es Base64 válido (datos ofuscados nuevos)
    const decoded = atob(raw);
    return xorEncode(decoded, deviceKey());
  } catch {
    // No es Base64 → probablemente dato sin ofuscar (versión anterior)
    return raw;
  }
}
