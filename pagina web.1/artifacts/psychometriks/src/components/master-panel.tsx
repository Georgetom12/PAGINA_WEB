import React, { useState, useEffect, useCallback } from "react";
import { shieldRead } from "@/lib/secure-storage";

// ─── Auth helper ──────────────────────────────────────────────────────────────
function getAdminSession() {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return null;
    const s = JSON.parse(shieldRead(raw)) as { user?: string; role?: string; plan?: string; ts?: number };
    if (!s.user) return null;
    const age = Date.now() - (s.ts ?? 0);
    if (age > 8 * 60 * 60 * 1000) return null;
    if (s.role !== "superadmin" && s.role !== "operator") return null;
    return s;
  } catch { return null; }
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

// Formatea ISO date "YYYY-MM-DDT..." → "DD/MM/YY" sin conversión de zona horaria
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const part = iso.slice(0, 10); // "YYYY-MM-DD"
  const [y, m, d] = part.split("-");
  return `${d}/${m}/${(y ?? "").slice(2)}`;
}

type Tab = "users" | "exchange" | "signals" | "revenue" | "config" | "support";

type Member = {
  id: number; username: string; displayName: string;
  email?: string | null; plan: string; active: boolean;
  expiresAt?: string | null; notes?: string | null; createdAt?: string;
};

function getExchangeSubmissions() {
  try {
    const all: unknown[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      if (key.startsWith("psy_exchange_submissions_")) {
        const arr = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
        all.push(...arr);
      }
    }
    return all as Array<{ name: string; symbol: string; chain: string; submittedAt: string; status: string; email?: string }>;
  } catch { return []; }
}

const PLAN_COLORS: Record<string, string> = {
  basico: "#4a6070", educacion: "#00e5ff", pro: "#e040fb", elite: "#ffd700",
};
const ROLE_COLORS: Record<string, string> = {
  member: "#4a6070", operator: "#00e5ff", superadmin: "#ffd700",
};

function getToken(): string {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return "";
    // Estrategia 1: JSON plano (formato nuevo)
    try {
      const s = JSON.parse(raw) as { token?: string };
      if (s.token) return s.token;
    } catch { /* intentar formato codificado */ }
    // Estrategia 2: XOR + Base64 (formato legacy / TOTP)
    try {
      const s = JSON.parse(shieldRead(raw)) as { token?: string };
      if (s.token) return s.token;
    } catch { /* no se pudo decodificar */ }
    return "";
  } catch { return ""; }
}

// API base: rutas relativas → worker intercepta y reenvía a Railway con token correcto
const DEFAULT_API = "";

function getApiBase(): string {
  try {
    const saved = localStorage.getItem("psy_api_base");
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, "");
  } catch {}
  return DEFAULT_API;
}

function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}

// ─── Tab content ──────────────────────────────────────────────────────────────
function TabUsers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    username: "", password: "", displayName: "", email: "", plan: "basico", expiresAt: "", notes: "",
  });

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", email: "", password: "", plan: "basico", expiresAt: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(apiUrl("/api/admin/members"), {
        headers: { "x-psy-token": getToken() },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const data = await res.json() as { ok: boolean; members: Member[] };
      setMembers(data.members ?? []);
    } catch (err) {
      setError(`Error al cargar usuarios: ${err instanceof Error ? err.message : "Sin conexión"}. API: ${getApiBase()}`);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleActive(m: Member) {
    try {
      await fetch(apiUrl(`/api/admin/members/${m.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({ active: !m.active }),
      });
    } catch { /* ignore */ }
    void load();
  }

  async function changePlan(m: Member, plan: string) {
    try {
      await fetch(apiUrl(`/api/admin/members/${m.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({ plan }),
      });
    } catch { /* ignore */ }
    void load();
  }

  function startEdit(m: Member) {
    setEditingId(m.id);
    setEditForm({
      displayName: m.displayName,
      email: m.email ?? "",
      password: "",
      plan: m.plan,
      expiresAt: m.expiresAt ? m.expiresAt.slice(0, 10) : "",
      notes: m.notes ?? "",
    });
    setEditMsg("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.displayName.trim()) { setEditMsg("El nombre visible es obligatorio"); return; }
    if (editForm.password && editForm.password.length < 6) { setEditMsg("La contraseña debe tener al menos 6 caracteres"); return; }
    setEditSaving(true); setEditMsg("");
    try {
      const body: Record<string, unknown> = {
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim() || null,
        plan: editForm.plan,
        expiresAt: editForm.expiresAt || null,
        notes: editForm.notes.trim() || null,
      };
      if (editForm.password) body["password"] = editForm.password;
      const res = await fetch(apiUrl(`/api/admin/members/${editingId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setEditMsg(data.error ?? `Error ${res.status}`); }
      else { setEditingId(null); void load(); }
    } catch (err) {
      setEditMsg(`Sin conexión: ${err instanceof Error ? err.message : ""}`);
    }
    finally { setEditSaving(false); }
  }

  async function deleteMember(m: Member) {
    if (!confirm(`¿Eliminar a ${m.username} permanentemente? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(apiUrl(`/api/admin/members/${m.id}`), {
        method: "DELETE",
        headers: { "x-psy-token": getToken() },
      });
    } catch { /* ignore */ }
    void load();
  }

  async function createMember(e: React.FormEvent) {
    e.preventDefault();
    const uname = form.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!uname) { setMsg("El nombre de usuario es obligatorio (solo letras, números, guiones)"); return; }
    if (!form.password || form.password.length < 6) { setMsg("La contraseña debe tener al menos 6 caracteres"); return; }
    if (!form.displayName.trim()) { setMsg("El nombre visible es obligatorio"); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch(apiUrl("/api/admin/members"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({
          username: uname,
          password: form.password,
          displayName: form.displayName.trim(),
          email: form.email.trim() || null,
          plan: form.plan,
          expiresAt: form.expiresAt || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setMsg(data.error ?? `Error ${res.status} al crear usuario`); }
      else {
        setMsg(`✓ Usuario "${uname}" creado — plan ${form.plan.toUpperCase()}`);
        setForm({ username: "", password: "", displayName: "", email: "", plan: "basico", expiresAt: "", notes: "" });
        setShowForm(false);
        void load();
      }
    } catch (err) {
      setMsg(`Sin conexión al API (${getApiBase()}). ${err instanceof Error ? err.message : ""}`);
    }
    finally { setSaving(false); }
  }

  const byPlan = { elite: 0, pro: 0, educacion: 0, basico: 0 };
  members.forEach(m => { if (m.plan in byPlan) byPlan[m.plan as keyof typeof byPlan]++; });

  const inp: React.CSSProperties = {
    width: "100%", background: "#060a0f", border: "1px solid #1a2535",
    color: "#eceff1", fontFamily: "'Share Tech Mono',monospace", fontSize: 11,
    padding: "7px 10px", borderRadius: 3, outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {(Object.entries(byPlan) as [string, number][]).map(([plan, count]) => (
          <div key={plan} style={{ background: "#060a0f", border: `1px solid ${PLAN_COLORS[plan]}33`, borderRadius: 4, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, color: PLAN_COLORS[plan], fontWeight: 700 }}>{count}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{plan}</div>
          </div>
        ))}
      </div>

      {/* Add user button */}
      <button onClick={() => { setShowForm(v => !v); setMsg(""); }} style={{
        background: showForm ? "#ff174414" : "#00e67614",
        border: `1px solid ${showForm ? "#ff174444" : "#00e67644"}`,
        color: showForm ? "#ff1744" : "#00e676",
        fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 1,
        padding: "8px 12px", borderRadius: 4, cursor: "pointer", width: "100%",
        textTransform: "uppercase",
      }}>
        {showForm ? "✕ CANCELAR" : "+ AGREGAR NUEVO USUARIO"}
      </button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createMember} style={{ background: "#080d14", border: "1px solid #00e67622", borderRadius: 6, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#00e676", letterSpacing: 2, marginBottom: 2 }}>NUEVO MIEMBRO</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Usuario * (para login)</label>
              <input style={inp} type="text" placeholder="ej: juantorres" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Contraseña * (mín 6 chars)</label>
              <input style={inp} type="text" placeholder="ej: PSY2026juan" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Nombre visible *</label>
              <input style={inp} placeholder="ej: Juan Torres" value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Plan</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="basico">BÁSICO — $9/mes</option>
                <option value="educacion">EDUCACIÓN — $29/mes</option>
                <option value="pro">PRO — $49/mes</option>
                <option value="elite">ELITE — $99/mes</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Correo (opcional, para contacto)</label>
              <input style={inp} type="email" placeholder="ej: juan@gmail.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase().trim() }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Vence (opcional)</label>
              <input style={inp} type="date" value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Notas internas</label>
              <input style={inp} placeholder="ej: Pagó PayPal 5/5" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          {msg && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: msg.startsWith("✓") ? "#00e676" : "#ff1744", padding: "6px 10px", background: msg.startsWith("✓") ? "#00e67614" : "#ff174414", borderRadius: 3 }}>{msg}</div>}

          <button type="submit" disabled={saving} style={{
            background: saving ? "#1a2535" : "#00e67620",
            border: "1px solid #00e67644", color: "#00e676",
            fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 2,
            padding: "10px", borderRadius: 4, cursor: saving ? "default" : "pointer",
            textTransform: "uppercase", fontWeight: 700,
          }}>
            {saving ? "GUARDANDO..." : "✓ CREAR USUARIO"}
          </button>
        </form>
      )}

      {msg && !showForm && (
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#00e676", padding: "6px 10px", background: "#00e67614", borderRadius: 3 }}>{msg}</div>
      )}

      {/* Members list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "16px 0", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2a4a5a" }}>Cargando usuarios...</div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "12px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#ff1744", border: "1px solid #ff174422", borderRadius: 4 }}>{error}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {members.map(m => {
            const isEditing = editingId === m.id;
            const rowInp: React.CSSProperties = {
              background: "#060a0f", border: "1px solid #1a3040",
              color: "#eceff1", fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
              padding: "5px 8px", outline: "none", width: "100%", boxSizing: "border-box",
            };
            return (
              <div key={m.id} style={{ border: `1px solid ${isEditing ? "#00e5ff33" : "#0d1520"}`, borderRadius: 4, overflow: "hidden" }}>
                {/* ── Row ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: isEditing ? "#060f14" : "#060a0f", padding: "7px 10px" }}>
                  {/* Dot activo/inactivo */}
                  <button title={m.active ? "Clic para desactivar" : "Clic para activar"} onClick={() => toggleActive(m)}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: m.active ? "#00e676" : "#ff1744", border: "none", flexShrink: 0, cursor: "pointer", padding: 0 }} />
                  {/* Nombre */}
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#eceff1", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.username}
                    {m.displayName && m.displayName !== m.username && (
                      <span style={{ color: "#4a6070", fontSize: 9, marginLeft: 6 }}>{m.displayName}</span>
                    )}
                    {m.email && (
                      <span style={{ color: "#2a4a5a", fontSize: 9, marginLeft: 6 }}>{m.email}</span>
                    )}
                  </div>
                  {/* Plan */}
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: PLAN_COLORS[m.plan] ?? "#4a6070", border: `1px solid ${PLAN_COLORS[m.plan] ?? "#4a6070"}33`, padding: "1px 5px", borderRadius: 2, textTransform: "uppercase", flexShrink: 0 }}>
                    {m.plan}
                  </span>
                  {/* Fecha vencimiento */}
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, flexShrink: 0,
                    color: m.expiresAt ? "#ffd700" : "#2a4a5a" }}>
                    {m.expiresAt ? "VENCE " + fmtDate(m.expiresAt) : "∞"}
                  </div>
                  {/* Editar */}
                  <button title={isEditing ? "Cancelar edición" : "Editar usuario"} onClick={() => isEditing ? setEditingId(null) : startEdit(m)}
                    style={{ background: isEditing ? "#00e5ff11" : "transparent", border: `1px solid ${isEditing ? "#00e5ff44" : "#1a3040"}`, color: isEditing ? "#00e5ff" : "#4a6070", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "2px 7px", borderRadius: 2, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>
                    {isEditing ? "✕" : "✏"}
                  </button>
                  {/* Eliminar */}
                  <button title="Eliminar usuario" onClick={() => deleteMember(m)}
                    style={{ background: "transparent", border: "1px solid #ff174422", color: "#ff174455", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "2px 6px", borderRadius: 2, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#ff174466"; e.currentTarget.style.color="#ff1744"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#ff174422"; e.currentTarget.style.color="#ff174455"; }}>
                    🗑
                  </button>
                </div>

                {/* ── Inline Edit Form ── */}
                {isEditing && (
                  <form onSubmit={saveEdit} style={{ background: "#040810", borderTop: "1px solid #00e5ff22", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#00e5ff", letterSpacing: 2, marginBottom: 2 }}>
                      EDITANDO: {m.username}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, marginBottom: 3 }}>NOMBRE VISIBLE *</div>
                        <input style={rowInp} value={editForm.displayName} onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, marginBottom: 3 }}>NUEVA CONTRASEÑA (dejar vacío = no cambiar)</div>
                        <input style={rowInp} type="text" placeholder="mín 6 chars" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, marginBottom: 3 }}>PLAN</div>
                        <select style={{ ...rowInp, cursor: "pointer" }} value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}>
                          <option value="basico">BÁSICO — $9/mes</option>
                          <option value="educacion">EDUCACIÓN — $29/mes</option>
                          <option value="pro">PRO — $49/mes</option>
                          <option value="elite">ELITE — $99/mes</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, marginBottom: 3 }}>CORREO (opcional)</div>
                        <input style={rowInp} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, marginBottom: 3 }}>VENCIMIENTO (opcional)</div>
                        <input style={rowInp} type="date" value={editForm.expiresAt} onChange={e => setEditForm(f => ({ ...f, expiresAt: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 1, marginBottom: 3 }}>NOTAS INTERNAS</div>
                        <input style={rowInp} placeholder="ej: Pagó PayPal 5/5" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>

                    {editMsg && (
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#ff1744", padding: "4px 8px", background: "#ff174410", border: "1px solid #ff174422", borderRadius: 2 }}>
                        {editMsg}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="submit" disabled={editSaving} style={{
                        flex: 1, padding: "7px", background: editSaving ? "#1a2535" : "#00e5ff18",
                        border: "1px solid #00e5ff44", color: "#00e5ff",
                        fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 2,
                        cursor: editSaving ? "not-allowed" : "pointer", fontWeight: 700,
                      }}>
                        {editSaving ? "GUARDANDO..." : "✓ GUARDAR CAMBIOS"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} style={{
                        padding: "7px 14px", background: "transparent", border: "1px solid #1a2535",
                        color: "#4a6070", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, cursor: "pointer",
                      }}>
                        CANCELAR
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", textAlign: "center", letterSpacing: 1 }}>
        {loading ? "..." : `TOTAL: ${members.length} MIEMBROS · ${members.filter(m => m.active).length} ACTIVOS`}
      </div>
    </div>
  );
}

function TabExchange() {
  const subs = getExchangeSubmissions();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { label: "PENDIENTES", val: subs.filter(s => s.status === "pending").length, color: "#ff9800" },
          { label: "APROBADOS", val: subs.filter(s => s.status === "approved").length, color: "#00e676" },
          { label: "TOTAL", val: subs.length, color: "#00e5ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#060a0f", border: `1px solid ${s.color}33`, borderRadius: 4, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: s.color, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {subs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#2a4a5a" }}>
          No hay solicitudes de listing aún.<br />Se guardan en localStorage por usuario.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {subs.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#060a0f", border: "1px solid #0d1520", borderRadius: 4, padding: "8px 12px" }}>
              <div style={{ flex: 1, fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#eceff1" }}>{s.name} ({s.symbol})</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070" }}>{s.chain}</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: s.status === "pending" ? "#ff9800" : "#00e676", border: `1px solid ${s.status === "pending" ? "#ff980033" : "#00e67633"}`, padding: "1px 6px", borderRadius: 2 }}>{s.status}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, background: "#00e67614", border: "1px solid #00e67644", color: "#00e676", padding: "2px 8px", borderRadius: 2, cursor: "pointer" }}>✓</button>
                <button style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, background: "#ff174414", border: "1px solid #ff174444", color: "#ff1744", padding: "2px 8px", borderRadius: 2, cursor: "pointer" }}>✗</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <a href="/exchange" style={{ display: "block", textAlign: "center", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#00e5ff", textDecoration: "none", padding: "8px", border: "1px solid #00e5ff22", borderRadius: 4 }}>
        IR AL EXCHANGE →
      </a>
    </div>
  );
}

interface PanelSignal {
  id: number; channelSlug: string; asset: string; direction: string;
  entry: string; tp1: string; tp2?: string | null; sl: string;
  leverage?: string | null; rr?: string | null; note?: string | null;
  status: string; createdAt: string;
}

const SIG_STATUSES = ["ACTIVA", "TP1 ✅", "TP2 ✅", "CERRADA ✅", "INVALIDADA ❌"];
const SIG_STATUS_COLOR: Record<string, string> = {
  "ACTIVA": "#00e676", "TP1 ✅": "#00e5ff", "TP2 ✅": "#00e5ff",
  "CERRADA ✅": "#4a6070", "INVALIDADA ❌": "#ff1744",
};

function TabSignals() {
  const inp: React.CSSProperties = {
    width: "100%", background: "#060a0f", border: "1px solid #1a2535",
    color: "#eceff1", fontFamily: "'Share Tech Mono',monospace", fontSize: 11,
    padding: "7px 10px", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070",
    letterSpacing: 2, display: "block", marginBottom: 4, textTransform: "uppercase",
  };

  const emptyForm = { asset: "", direction: "LONG", entry: "", tp1: "", tp2: "", sl: "", leverage: "", rr: "", note: "", channelSlug: "default" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [recentSigs, setRecentSigs] = useState<PanelSignal[]>([]);
  const [loadingSigs, setLoadingSigs] = useState(true);

  const flash = (m: string, ok = false) => { setMsg(m); setMsgOk(ok); setTimeout(() => setMsg(""), 5000); };

  const loadSignals = useCallback(async () => {
    setLoadingSigs(true);
    try {
      const r = await fetch(apiUrl("/api/signals"), { headers: { "x-psy-token": getToken() } });
      const d = await r.json() as { signals?: PanelSignal[] };
      setRecentSigs((d.signals ?? []).slice(0, 15));
    } catch { /* silent */ }
    finally { setLoadingSigs(false); }
  }, []);

  useEffect(() => { void loadSignals(); }, [loadSignals]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!form.asset || !form.entry || !form.tp1 || !form.sl) { flash("Asset, Entrada, TP1 y Stop Loss son obligatorios"); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch(apiUrl("/api/signals"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({ ...form, tp2: form.tp2 || null, leverage: form.leverage || null, rr: form.rr || null, note: form.note || null }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { flash(data.error ?? "Error al publicar señal"); }
      else {
        flash(`✓ Señal ${form.asset} ${form.direction} publicada en ${form.channelSlug === "all" ? "todos los canales" : `canal "${form.channelSlug}"`}`, true);
        setForm(emptyForm); setShowForm(false); void loadSignals();
      }
    } catch { flash("Error de conexión. Verificá la URL del API en ⚙️ Config."); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(apiUrl(`/api/signals/${id}/status`), {
      method: "PATCH", headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
      body: JSON.stringify({ status }),
    });
    void loadSignals();
  }

  async function deleteSig(id: number) {
    if (!confirm("¿Eliminar esta señal?")) return;
    await fetch(apiUrl(`/api/signals/${id}`), { method: "DELETE", headers: { "x-psy-token": getToken() } });
    void loadSignals();
  }

  function fmtDate(iso: string) {
    try {
      const d = new Date(iso); const h = (Date.now() - d.getTime()) / 3_600_000;
      if (h < 1)  return `Hace ${Math.round(h*60)}min`;
      if (h < 24) return `Hoy ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
      if (h < 48) return "Ayer";
      return `Hace ${Math.round(h/24)}d`;
    } catch { return "Reciente"; }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2 }}>
          ÚLTIMAS {recentSigs.length} SEÑALES
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 1,
          background: showForm ? "#1a2535" : "#00e67622", border: `1px solid ${showForm ? "#1a2535" : "#00e67666"}`,
          color: showForm ? "#4a6070" : "#00e676", padding: "6px 14px", cursor: "pointer",
        }}>
          {showForm ? "✕ CANCELAR" : "+ NUEVA SEÑAL"}
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: "8px 12px", border: `1px solid ${msgOk ? "#00e67633" : "#ff174433"}`, background: msgOk ? "#00e67608" : "#ff174408", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: msgOk ? "#00e676" : "#ff6b6b" }}>
          {msg}
        </div>
      )}

      {/* Publish form */}
      {showForm && (
        <form onSubmit={publish} style={{ background: "#060a0f", border: "1px solid #00e5ff22", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#00e5ff", letterSpacing: 2, marginBottom: 4 }}>PUBLICAR SEÑAL</div>

          {/* Row 1: Asset + Direction */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Par (Asset)</label>
              <input style={inp} value={form.asset} onChange={e => setForm(f => ({ ...f, asset: e.target.value.toUpperCase() }))} placeholder="ej: BTC/USDT" />
            </div>
            <div>
              <label style={lbl}>Dirección</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["LONG", "SHORT"].map(d => (
                  <button type="button" key={d} onClick={() => setForm(f => ({ ...f, direction: d }))} style={{
                    flex: 1, padding: "7px 0", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, cursor: "pointer",
                    background: form.direction === d ? (d === "LONG" ? "#00e67622" : "#ff174422") : "#060a0f",
                    border: `1px solid ${form.direction === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#1a2535"}`,
                    color: form.direction === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#4a6070",
                  }}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Entry, TP1, SL */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Entrada *</label><input style={inp} value={form.entry} onChange={e => setForm(f => ({ ...f, entry: e.target.value }))} placeholder="ej: 96,500" /></div>
            <div><label style={lbl}>TP1 *</label><input style={inp} value={form.tp1} onChange={e => setForm(f => ({ ...f, tp1: e.target.value }))} placeholder="ej: 100,000" /></div>
            <div><label style={lbl}>Stop Loss *</label><input style={inp} value={form.sl} onChange={e => setForm(f => ({ ...f, sl: e.target.value }))} placeholder="ej: 93,000" /></div>
          </div>

          {/* Row 3: TP2, Leverage, R/R */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>TP2 (opcional)</label><input style={inp} value={form.tp2} onChange={e => setForm(f => ({ ...f, tp2: e.target.value }))} placeholder="ej: 105,000" /></div>
            <div><label style={lbl}>Leverage</label><input style={inp} value={form.leverage} onChange={e => setForm(f => ({ ...f, leverage: e.target.value }))} placeholder="ej: 5x" /></div>
            <div><label style={lbl}>R/R</label><input style={inp} value={form.rr} onChange={e => setForm(f => ({ ...f, rr: e.target.value }))} placeholder="ej: 1:2.5" /></div>
          </div>

          {/* Row 4: Channel + Note */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <div>
              <label style={lbl}>Canal</label>
              <select style={{ ...inp }} value={form.channelSlug} onChange={e => setForm(f => ({ ...f, channelSlug: e.target.value }))}>
                <option value="default">Default</option>
                <option value="all">📢 TODOS</option>
              </select>
            </div>
            <div><label style={lbl}>Nota / Análisis</label><input style={inp} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="ej: Order block diario confirmado" /></div>
          </div>

          <button type="submit" disabled={saving} style={{
            padding: "10px", background: saving ? "#1a2535" : "#00e676", color: "#020408",
            fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 2,
            border: "none", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700,
          }}>
            {saving ? "PUBLICANDO..." : "✓ PUBLICAR SEÑAL"}
          </button>
        </form>
      )}

      {/* Signal list */}
      {loadingSigs ? (
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2a4a5a", textAlign: "center", padding: 20 }}>Cargando señales...</div>
      ) : recentSigs.length === 0 ? (
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2a4a5a", textAlign: "center", padding: 20, border: "1px solid #1a2535" }}>
          No hay señales publicadas aún. Creá la primera con el botón de arriba.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {recentSigs.map(s => {
            const sc = SIG_STATUS_COLOR[s.status] ?? "#4a6070";
            const dc = s.direction === "LONG" ? "#00e676" : "#ff1744";
            return (
              <div key={s.id} style={{ background: "#060a0f", border: "1px solid #1a2535", padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", width: 50 }}>#{s.id}</span>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#eceff1", minWidth: 90 }}>{s.asset}</span>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: dc, border: `1px solid ${dc}44`, padding: "1px 6px" }}>{s.direction}</span>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070" }}>E:{s.entry}</span>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#00e67699" }}>TP1:{s.tp1}</span>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#ff174466" }}>SL:{s.sl}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a" }}>{fmtDate(s.createdAt)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a" }}>ESTADO:</span>
                  {SIG_STATUSES.map(st => (
                    <button key={st} type="button" onClick={() => updateStatus(s.id, st)} style={{
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "2px 8px", cursor: "pointer",
                      background: s.status === st ? `${SIG_STATUS_COLOR[st] ?? "#4a6070"}22` : "transparent",
                      border: `1px solid ${s.status === st ? (SIG_STATUS_COLOR[st] ?? "#4a6070") : "#1a2535"}`,
                      color: s.status === st ? (SIG_STATUS_COLOR[st] ?? "#4a6070") : "#2a4a5a",
                    }}>{st}</button>
                  ))}
                  <button type="button" onClick={() => deleteSig(s.id)} style={{
                    marginLeft: "auto", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "2px 8px",
                    background: "transparent", border: "1px solid #ff174433", color: "#ff174466", cursor: "pointer",
                  }}>🗑 DEL</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <a href="https://t.me/psychometriks_pro" target="_blank" rel="noopener noreferrer"
        style={{ display: "block", textAlign: "center", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#229ED9", textDecoration: "none", padding: "8px", border: "1px solid #229ED922", marginTop: 4 }}>
        ✈️ CANAL TELEGRAM PRINCIPAL →
      </a>
    </div>
  );
}

function TabRevenue() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const PRICES: Record<string, number> = { basico: 9, educacion: 29, pro: 49, elite: 99 };

  useEffect(() => {
    fetch(apiUrl("/api/admin/members"), { headers: { "x-psy-token": getToken() } })
      .then(r => r.json())
      .then((d: { members?: Member[] }) => setMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = members.filter(m => m.active);
  const mrr = active.reduce((acc, m) => acc + (PRICES[m.plan] ?? 0), 0);
  const arr = mrr * 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "MRR", val: loading ? "..." : `$${mrr}`, color: "#00e676", sub: "ingreso mensual recurrente" },
          { label: "ARR PROYECTADO", val: loading ? "..." : `$${arr}`, color: "#ffd700", sub: "anualizado" },
          { label: "MIEMBROS ACTIVOS", val: loading ? "..." : active.length.toString(), color: "#00e5ff", sub: "subscripciones activas" },
          { label: "FEE EXCHANGE", val: "1.5%", color: "#e040fb", sub: "por transacción" },
        ].map(s => (
          <div key={s.label} style={{ background: "#060a0f", border: `1px solid ${s.color}22`, borderRadius: 4, padding: "12px 14px" }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: s.color, fontWeight: 700, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#060a0f", border: "1px solid #1a2535", borderRadius: 4, padding: "12px 14px" }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2, marginBottom: 10 }}>DISTRIBUCIÓN DE PLANES</div>
        {(Object.entries(PRICES) as [string, number][]).map(([plan, price]) => {
          const count = members.filter(m => m.plan === plan).length;
          const pct = members.length ? Math.round(count / members.length * 100) : 0;
          return (
            <div key={plan} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: PLAN_COLORS[plan], textTransform: "uppercase" }}>{plan}</span>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, color: "#eceff1" }}>{count} · ${price}/mes</span>
              </div>
              <div style={{ height: 4, background: "#0d1520", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: PLAN_COLORS[plan], borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabConfig() {
  const [apiBase, setApiBase] = useState(() => {
    try {
      const saved = localStorage.getItem("psy_api_base");
      return (saved && saved.trim()) ? saved.trim() : "";
    } catch { return ""; }
  });
  const [apiSaved, setApiSaved] = useState(false);

  const effectiveApi = (apiBase.trim()) || DEFAULT_API;

  function saveApiBase() {
    try {
      const trimmed = apiBase.trim().replace(/\/$/, "");
      localStorage.setItem("psy_api_base", trimmed);
      setApiBase(trimmed);
      setApiSaved(true);
      setTimeout(() => setApiSaved(false), 2500);
    } catch {}
  }

  function resetApiBase() {
    try { localStorage.removeItem("psy_api_base"); } catch {}
    setApiBase("");
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2500);
  }

  const links = [
    { label: "🔐 PSY VAULT — Bóveda", href: "/boveda", color: "#ffd700" },
    { label: "Exchange — PSY Exchange", href: "/exchange", color: "#00e5ff" },
    { label: "Señales en vivo", href: "/signals", color: "#e040fb" },
    { label: "Altcoins Signals (Elite)", href: "/altcoins-signals", color: "#ffd700" },
    { label: "Bolsa de Valores (Elite)", href: "/bolsa", color: "#40c4ff" },
    { label: "Spot vs Perpetuos", href: "/spot-perp", color: "#ff9800" },
    { label: "Planes & Precios", href: "/pricing", color: "#00e676" },
    { label: "Aula Virtual", href: "/aula/", color: "#00e676" },
  ];

  const inp: React.CSSProperties = {
    flex: 1, background: "#060a0f", border: "1px solid #ffd70033",
    color: "#eceff1", fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
    padding: "7px 10px", borderRadius: 3, outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* API Server URL */}
      <div style={{ background: "#080d14", border: "1px solid #ffd70022", borderRadius: 6, padding: "12px 14px", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#ffd700", letterSpacing: 2, marginBottom: 6 }}>
          🔌 URL DEL SERVIDOR API
        </div>
        {/* Status: active URL */}
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#00e676", marginBottom: 8, padding: "4px 8px", background: "#00e67608", border: "1px solid #00e67622", borderRadius: 2 }}>
          ● ACTIVO: {effectiveApi}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", marginBottom: 8, lineHeight: 1.6 }}>
          URL de Railway ya configurada por defecto. Solo cambiá si usás otro servidor.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={inp}
            value={apiBase}
            onChange={e => setApiBase(e.target.value)}
            placeholder={`Por defecto: ${DEFAULT_API}`}
            onKeyDown={e => e.key === "Enter" && saveApiBase()}
          />
          <button onClick={saveApiBase} style={{
            background: apiSaved ? "#00e67620" : "#ffd70018",
            border: `1px solid ${apiSaved ? "#00e67644" : "#ffd70044"}`,
            color: apiSaved ? "#00e676" : "#ffd700",
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
            padding: "7px 12px", borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {apiSaved ? "✓ OK" : "GUARDAR"}
          </button>
          {apiBase.trim() && (
            <button onClick={resetApiBase} style={{
              background: "transparent", border: "1px solid #ff174433", color: "#ff174466",
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              padding: "7px 10px", borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap",
            }}>
              RESET
            </button>
          )}
        </div>
      </div>

      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2, marginBottom: 2 }}>ACCESO RÁPIDO</div>
      {links.map(l => (
        <a key={l.href} href={l.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: "#060a0f", border: `1px solid ${l.color}22`, borderRadius: 4, padding: "8px 12px", transition: "border-color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${l.color}66`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = `${l.color}22`)}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#eceff1", flex: 1 }}>{l.label}</div>
          <div style={{ color: l.color, fontSize: 12 }}>→</div>
        </a>
      ))}
      <div style={{ marginTop: 4, fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", textAlign: "center", letterSpacing: 1 }}>
        PANEL MAESTRO · SOLO SUPERADMIN
      </div>
    </div>
  );
}

// ─── TabSupport ───────────────────────────────────────────────────────────────
type SupportMsg = { id: number; sender: "user" | "admin"; message: string; createdAt: string; readAt?: string | null };
type Conversation = { username: string; lastMessage: string; lastAt: string; unread: number; messages: SupportMsg[] };

function TabSupport() {
  const [convs, setConvs] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [planUpgrade, setPlanUpgrade] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(apiUrl("/api/admin/support/inbox"), {
        headers: { "x-psy-token": getToken() },
      });
      const d = await r.json() as { ok: boolean; conversations: Conversation[] };
      setConvs(d.conversations ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => { void load(); const iv = setInterval(() => { void load(); }, 20000); return () => clearInterval(iv); }, [load]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true); setMsg("");
    try {
      const r = await fetch(apiUrl("/api/admin/support/reply"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({ username: selected, message: reply.trim() }),
      });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setReply(""); setMsg("✓ Enviado"); void load(); }
      else setMsg(d.error ?? "Error al enviar");
    } catch { setMsg("Error de conexión"); }
    setSending(false);
  };

  const upgradePlan = async () => {
    if (!selected || !planUpgrade) return;
    setSending(true); setMsg("");
    try {
      const r = await fetch(apiUrl("/api/admin/support/upgrade-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({ username: selected, plan: planUpgrade }),
      });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setMsg(`✓ Plan actualizado a ${planUpgrade}`); setPlanUpgrade(""); void load(); }
      else setMsg(d.error ?? "Error");
    } catch { setMsg("Error de conexión"); }
    setSending(false);
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const selectedConv = convs.find(c => c.username === selected);

  return (
    <div style={{ display: "flex", gap: 12, height: 380 }}>
      {/* Conversation list */}
      <div style={{ width: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#4a6070", letterSpacing: 2, marginBottom: 4 }}>
          INBOX ({convs.length})
        </div>
        {loading && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070" }}>Cargando...</div>}
        {convs.map(c => (
          <button key={c.username} onClick={() => setSelected(c.username)}
            style={{
              background: selected === c.username ? "rgba(0,229,255,0.08)" : "rgba(0,0,0,0.3)",
              border: `1px solid ${selected === c.username ? "#00e5ff44" : "#0d1520"}`,
              borderRadius: 4, padding: "8px 10px", textAlign: "left", cursor: "pointer", transition: "all 0.2s",
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#eceff1", fontWeight: 700 }}>{c.username}</div>
              {c.unread > 0 && (
                <div style={{ background: "#ff1744", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{c.unread}</div>
              )}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{c.lastMessage}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#2a4a5a", marginTop: 2 }}>{fmtTime(c.lastAt)}</div>
          </button>
        ))}
        {!loading && convs.length === 0 && (
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2a4a5a", textAlign: "center", marginTop: 20 }}>Sin mensajes</div>
        )}
      </div>

      {/* Chat view */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {!selectedConv ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#2a4a5a", textAlign: "center" }}>
              ← Seleccioná una conversación
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: "#0a1018", border: "1px solid #0d1520", borderRadius: 4, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#00e5ff", fontWeight: 700 }}>@{selectedConv.username}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select value={planUpgrade} onChange={e => setPlanUpgrade(e.target.value)}
                  style={{ background: "#060a0f", border: "1px solid #1a2535", color: "#eceff1", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "3px 6px", borderRadius: 3 }}>
                  <option value="">Subir plan...</option>
                  {["exchange","basico","educacion","pro","elite"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={upgradePlan} disabled={!planUpgrade || sending}
                  style={{ background: "#ffd70015", border: "1px solid #ffd70044", color: "#ffd700", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "3px 8px", borderRadius: 3, cursor: "pointer", opacity: !planUpgrade ? 0.5 : 1 }}>
                  ✓ Aplicar
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedConv.messages.slice().reverse().map(m => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "admin" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "6px 10px", borderRadius: 6, fontSize: 11,
                    fontFamily: "'Share Tech Mono',monospace",
                    background: m.sender === "admin" ? "rgba(0,229,255,0.08)" : "#0a1018",
                    border: `1px solid ${m.sender === "admin" ? "#00e5ff22" : "#1a2535"}`,
                    color: "#eceff1",
                  }}>
                    {m.sender === "admin" && <div style={{ fontSize: 8, color: "#00e5ff", marginBottom: 3 }}>⬡ ADMIN</div>}
                    <div>
                      {m.message.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                        pi % 2 === 1 ? <strong key={pi}>{part}</strong> : <React.Fragment key={pi}>{part}</React.Fragment>
                      )}
                    </div>
                    <div style={{ fontSize: 8, color: "#2a4a5a", marginTop: 3, textAlign: "right" }}>{fmtTime(m.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                placeholder="Responder..."
                style={{ flex: 1, background: "#060a0f", border: "1px solid #1a2535", color: "#eceff1", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, padding: "6px 10px", borderRadius: 4, outline: "none" }} />
              <button onClick={sendReply} disabled={!reply.trim() || sending}
                style={{ background: "#00e5ff15", border: "1px solid #00e5ff44", color: "#00e5ff", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "6px 12px", borderRadius: 4, cursor: "pointer", opacity: !reply.trim() ? 0.5 : 1 }}>
                {sending ? "..." : "→"}
              </button>
            </div>
            {msg && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: msg.startsWith("✓") ? "#00e676" : "#ff1744" }}>{msg}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MasterPanel() {
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    const check = () => setSession(getAdminSession());
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!session) return null;

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "users",    icon: "👥", label: "Usuarios" },
    { id: "support",  icon: "💬", label: "Soporte" },
    { id: "exchange", icon: "🚀", label: "Exchange" },
    { id: "signals",  icon: "📡", label: "Señales" },
    { id: "revenue",  icon: "💰", label: "Revenue" },
    { id: "config",   icon: "⚙️", label: "Config" },
  ];

  return (
    <>
      <style>{`
        @keyframes masterGlow { 0%,100%{box-shadow:0 0 16px rgba(255,215,0,0.4)} 50%{box-shadow:0 0 30px rgba(255,215,0,0.7)} }
        @keyframes masterFlow { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes masterPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .master-panel-scroll::-webkit-scrollbar { width: 3px }
        .master-panel-scroll::-webkit-scrollbar-thumb { background: #1a2a3a; border-radius: 2px }
      `}</style>

      <div style={{ position: "fixed", bottom: 90, right: 24, zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {/* Panel */}
        <div style={{
          width: 480,
          maxHeight: open ? 580 : 0,
          background: "#060a0f",
          border: "1px solid #ffd70044",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          opacity: open ? 1 : 0,
          transform: open ? "scale(1)" : "scale(0.92)",
          transformOrigin: "bottom right",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: open ? "all" : "none",
          boxShadow: open ? "0 0 60px rgba(255,215,0,0.12), 0 20px 60px rgba(0,0,0,0.6)" : "none",
        }}>
          {/* Rainbow top bar */}
          <div style={{ height: 2, background: "linear-gradient(90deg, #ffd700, #00e5ff, #e040fb, #00e676, #ffd700)", backgroundSize: "200% 100%", animation: "masterFlow 3s linear infinite", flexShrink: 0 }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px", borderBottom: "1px solid #0d1520", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffd700" }}>
                <ShieldIcon />
              </div>
              <div>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, fontWeight: 700, color: "#ffd700", letterSpacing: "0.15em" }}>PANEL MAESTRO</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: "0.1em", marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00e676", display: "inline-block", animation: "masterPulse 2s infinite" }} />
                  SUPERADMIN · {session.user?.toUpperCase()}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#4a6070", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CloseIcon />
            </button>
          </div>

          {/* Tab nav */}
          <div style={{ display: "flex", borderBottom: "1px solid #0d1520", flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: "8px 4px", background: "none", border: "none", cursor: "pointer",
                  borderBottom: tab === t.id ? "2px solid #ffd700" : "2px solid transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  transition: "all 0.2s",
                }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, letterSpacing: 1, color: tab === t.id ? "#ffd700" : "#4a6070", textTransform: "uppercase" }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="master-panel-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
            {tab === "users"    && <TabUsers />}
            {tab === "support"  && <TabSupport />}
            {tab === "exchange" && <TabExchange />}
            {tab === "signals"  && <TabSignals />}
            {tab === "revenue"  && <TabRevenue />}
            {tab === "config"   && <TabConfig />}
          </div>
        </div>

        {/* FAB bubble */}
        <button onClick={() => setOpen(v => !v)}
          title="Panel Maestro — Superadmin"
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: open ? "rgba(255,215,0,0.1)" : "linear-gradient(135deg, rgba(255,215,0,0.25), rgba(0,229,255,0.1))",
            border: `1px solid ${open ? "#4a5060" : "#ffd700"}`,
            color: "#ffd700", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
            animation: open ? "none" : "masterGlow 2.5s ease-in-out infinite",
            transition: "all 0.25s",
          }}>
          {open ? <CloseIcon /> : <ShieldIcon />}
        </button>
      </div>
    </>
  );
}
