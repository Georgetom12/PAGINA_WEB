import React, { useState, useEffect, useCallback } from "react";
import {
  User, UserRole, ROLE_META,
  getUsers, createUser, deleteUser, updateUser, generatePassword,
} from "../auth/types";

interface Props {
  currentUser: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

const BTN = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "danger" | "ghost" | "gold" | "teal" }) => {
  const colors: Record<string, { bg: string; border: string; color: string }> = {
    primary: { bg: "#002233",    border: "#00e5ff", color: "#00e5ff" },
    danger:  { bg: "#330011",    border: "#ff1744", color: "#ff1744" },
    ghost:   { bg: "transparent",border: "#1a3a4a", color: "#4a7a9b" },
    gold:    { bg: "#1a1200",    border: "#ffd700", color: "#ffd700" },
    teal:    { bg: "#001a1a",    border: "#00e676", color: "#00e676" },
  };
  const c = colors[props.variant || "ghost"]!;
  return (
    <button {...props} style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4,
      color: c.color, padding: "8px 16px", fontSize: 11, letterSpacing: 2,
      textTransform: "uppercase", cursor: "pointer", fontFamily: "'Orbitron', monospace",
      transition: "opacity .2s", ...props.style,
    }} />
  );
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{
    background: "#060a0f", border: "1px solid #1a3a4a", borderRadius: 4,
    padding: "10px 12px", color: "#e0f4ff", fontSize: 14, outline: "none",
    fontFamily: "'Share Tech Mono', monospace", width: "100%", boxSizing: "border-box" as const,
    ...props.style,
  }} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} style={{
    background: "#060a0f", border: "1px solid #1a3a4a", borderRadius: 4,
    padding: "10px 12px", color: "#e0f4ff", fontSize: 14, outline: "none",
    fontFamily: "'Rajdhani', sans-serif", width: "100%", boxSizing: "border-box" as const,
    ...props.style,
  }} />
);

// ── Landing config ──────────────────────────────────────────────────────────
const PSY_CONFIG_KEY = "psy_config";
const DEFAULT_LANDING_CONFIG = {
  prices: { basic: "5", pro: "49", elite: "99" },
  paypal: "psychometriks@gmail.com",
  binance: "psychometriks_pro",
  bank: "Banco Pichincha\nCuenta Ahorros: 2207XXXXXX\nNombre: JORGE\nCédula: 17XXXXXXXX",
};
type LandingConfig = typeof DEFAULT_LANDING_CONFIG;
function loadLandingConfig(): LandingConfig {
  try {
    const raw = localStorage.getItem(PSY_CONFIG_KEY);
    if (raw) return { ...DEFAULT_LANDING_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_LANDING_CONFIG };
}
function saveLandingConfig(c: LandingConfig) {
  localStorage.setItem(PSY_CONFIG_KEY, JSON.stringify(c));
}

// ── Signals localStorage ────────────────────────────────────────────────────
const PSY_SIGNALS_KEY = "psy_signals_v2";
interface StoredSignal {
  id: string; asset: string; direction: string; entry: string;
  tp1: string; tp2: string; tp3: string; sl: string;
  leverage: string; rr: string; note: string; source: string;
  status: string; ts: string; channelSlug?: string;
}
function loadSignals(): StoredSignal[] {
  try { return JSON.parse(localStorage.getItem(PSY_SIGNALS_KEY) || "[]"); }
  catch { return []; }
}
function saveSignals(sigs: StoredSignal[]) {
  localStorage.setItem(PSY_SIGNALS_KEY, JSON.stringify(sigs));
}

// ── Channel type ─────────────────────────────────────────────────────────────
interface Channel {
  id: number;
  slug: string;
  name: string;
  description?: string;
  color: string;
  botToken: string;
  channelId: string;
  active: boolean;
}

const CHANNEL_COLORS = ["#00e5ff","#00e676","#ffd700","#e040fb","#ff6d00","#ff1744","#64b5f6","#80cbc4"];

type Tab = "users" | "create" | "signals" | "canales" | "precios" | "myaccount";

export function AdminPanel({ currentUser, onClose, onUserUpdated }: Props) {
  const [tab, setTab]   = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>(getUsers());
  const [msg, setMsg]   = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // Precios
  const [landingCfg, setLandingCfg] = useState<LandingConfig>(loadLandingConfig);
  const handleLandingSave  = () => { saveLandingConfig(landingCfg); flash("✅ Configuración guardada."); };
  const handleLandingReset = () => { setLandingCfg({ ...DEFAULT_LANDING_CONFIG }); saveLandingConfig({ ...DEFAULT_LANDING_CONFIG }); flash("Valores restaurados"); };

  // Users
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState(generatePassword());
  const [newRole, setNewRole]         = useState<UserRole>("PRO");
  const [newDisplay, setNewDisplay]   = useState("");
  const [myUsername, setMyUsername]   = useState(currentUser.username);
  const [myDisplayName, setMyDisplayName] = useState(currentUser.displayName || "");
  const [myOldPwd, setMyOldPwd]       = useState("");
  const [myNewPwd, setMyNewPwd]       = useState("");
  const [myNewPwd2, setMyNewPwd2]     = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Signal composer ─────────────────────────────────────────────────────
  const [sigAsset,    setSigAsset]    = useState("BTC/USDT");
  const [sigDir,      setSigDir]      = useState<"LONG"|"SHORT">("LONG");
  const [sigEntry,    setSigEntry]    = useState("");
  const [sigTp1,      setSigTp1]      = useState("");
  const [sigTp2,      setSigTp2]      = useState("");
  const [sigTp3,      setSigTp3]      = useState("");
  const [sigSl,       setSigSl]       = useState("");
  const [sigLev,      setSigLev]      = useState("3x");
  const [sigRr,       setSigRr]       = useState("");
  const [sigNote,     setSigNote]     = useState("");
  const [sigSource,   setSigSource]   = useState<"PSY BOT"|"ANÁLISIS IA"|"MANUAL">("ANÁLISIS IA");
  const [sigTarget,   setSigTarget]   = useState<"all" | string>("all");
  const [sigBusy,     setSigBusy]     = useState(false);
  const [sigHistory,  setSigHistory]  = useState<StoredSignal[]>(loadSignals);

  // ── Channels state ──────────────────────────────────────────────────────
  const [channelList,    setChannelList]    = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [editingCh,      setEditingCh]      = useState<Partial<Channel> | null>(null);
  const [chBusy,         setChBusy]         = useState(false);
  const [confirmDelCh,   setConfirmDelCh]   = useState<number | null>(null);

  const loadChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const r = await fetch("/api/channels/admin");
      if (r.ok) {
        const data = await r.json() as { channels: Channel[] };
        setChannelList(data.channels);
      }
    } catch {}
    setChannelsLoading(false);
  }, []);

  useEffect(() => {
    setSigHistory(loadSignals());
    if (tab === "canales") loadChannels();
  }, [tab, loadChannels]);

  const refresh = () => setUsers(getUsers());

  const flash = (text: string, type: "ok" | "err" = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Publish signal ──────────────────────────────────────────────────────
  const handlePublishSignal = async () => {
    if (!sigEntry.trim() || !sigTp1.trim() || !sigSl.trim()) {
      flash("Entrada, TP1 y Stop Loss son obligatorios", "err"); return;
    }
    setSigBusy(true);
    const sig: StoredSignal = {
      id: `SIG-${String(Date.now()).slice(-5)}`,
      asset: sigAsset, direction: sigDir,
      entry: sigEntry, tp1: sigTp1, tp2: sigTp2, tp3: sigTp3,
      sl: sigSl, leverage: sigLev, rr: sigRr, note: sigNote,
      source: sigSource, status: "ACTIVA", ts: new Date().toISOString(),
      channelSlug: sigTarget === "all" ? undefined : sigTarget,
    };
    saveSignals([sig, ...loadSignals()]);
    setSigHistory(loadSignals());

    const endpoint = sigTarget === "all"
      ? "/api/telegram/broadcast"
      : `/api/telegram/signal/${sigTarget}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sig),
      });
      if (res.ok) {
        const data = await res.json() as { sent?: { name: string }[]; channel?: string };
        const dest = data.sent ? data.sent.map(s => s.name).join(", ") : (data.channel ?? "canal");
        flash(`✅ Señal ${sigAsset} ${sigDir} publicada → ${dest}`);
      } else {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        flash(`Guardada localmente. Telegram: ${err.error || res.status}`, "err");
      }
    } catch {
      flash("Guardada localmente. Sin conexión al API", "err");
    }
    setSigBusy(false);
    setSigEntry(""); setSigTp1(""); setSigTp2(""); setSigTp3("");
    setSigSl(""); setSigRr(""); setSigNote("");
  };

  const handleDeleteSignal = (id: string) => {
    const updated = loadSignals().filter(s => s.id !== id);
    saveSignals(updated);
    setSigHistory(updated);
    flash("Señal eliminada");
  };

  // ── Channel CRUD ─────────────────────────────────────────────────────────
  const handleSaveChannel = async () => {
    if (!editingCh) return;
    if (!editingCh.slug?.trim() || !editingCh.name?.trim() || !editingCh.channelId?.trim()) {
      flash("Slug, nombre y Channel ID son obligatorios", "err"); return;
    }
    if (!editingCh.id && !editingCh.botToken?.trim()) {
      flash("El Bot Token es obligatorio al crear un canal", "err"); return;
    }
    setChBusy(true);
    try {
      const isNew = !editingCh.id;
      const url   = isNew ? "/api/channels" : `/api/channels/${editingCh.id}`;
      const method = isNew ? "POST" : "PATCH";
      const body: Record<string, unknown> = {
        slug:        editingCh.slug,
        name:        editingCh.name,
        description: editingCh.description ?? "",
        color:       editingCh.color ?? "#00e5ff",
        channelId:   editingCh.channelId,
        active:      editingCh.active ?? true,
      };
      if (editingCh.botToken?.trim()) body["botToken"] = editingCh.botToken;
      const r   = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json() as { error?: string };
      if (!r.ok) { flash(data.error ?? "Error al guardar", "err"); }
      else { flash(isNew ? "✅ Canal creado" : "✅ Canal actualizado"); setEditingCh(null); await loadChannels(); }
    } catch { flash("Error de red", "err"); }
    setChBusy(false);
  };

  const handleToggleChannel = async (ch: Channel) => {
    await fetch(`/api/channels/${ch.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ch.active }),
    });
    await loadChannels();
    flash(`Canal ${ch.name} ${!ch.active ? "activado" : "desactivado"}`);
  };

  const handleDeleteChannel = async (id: number) => {
    await fetch(`/api/channels/${id}`, { method: "DELETE" });
    setConfirmDelCh(null);
    await loadChannels();
    flash("Canal eliminado");
  };

  // ── User handlers ────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!newUsername.trim() || !newPassword.trim()) { flash("Usuario y contraseña son obligatorios", "err"); return; }
    if (getUsers().some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) { flash("Ese nombre ya existe", "err"); return; }
    createUser(newUsername, newPassword, newRole, newDisplay || newUsername);
    refresh(); flash(`Usuario ${newUsername.toUpperCase()} creado`);
    setNewUsername(""); setNewPassword(generatePassword()); setNewDisplay("");
  };
  const handleDelete = (id: string) => {
    if (id === currentUser.id) { flash("No podés eliminarte a vos mismo", "err"); return; }
    deleteUser(id); refresh(); setConfirmDelete(null); flash("Usuario eliminado");
  };
  const handleRoleChange = (id: string, role: UserRole) => {
    if (id === currentUser.id) { flash("Cambiá tu rol desde 'Mi Cuenta'", "err"); return; }
    updateUser(id, { role }); refresh(); flash("Rol actualizado");
  };
  const handleMyAccount = () => {
    if (!myUsername.trim()) { flash("El usuario no puede estar vacío", "err"); return; }
    const updates: Partial<User> = { username: myUsername.trim().toUpperCase(), displayName: myDisplayName.trim() || myUsername.trim() };
    if (myNewPwd) {
      if (myOldPwd !== currentUser.password) { flash("Contraseña actual incorrecta", "err"); return; }
      if (myNewPwd !== myNewPwd2) { flash("Las contraseñas nuevas no coinciden", "err"); return; }
      if (myNewPwd.length < 6) { flash("Mínimo 6 caracteres", "err"); return; }
      updates.password = myNewPwd;
    }
    updateUser(currentUser.id, updates); refresh(); onUserUpdated({ ...currentUser, ...updates });
    flash("Datos actualizados."); setMyOldPwd(""); setMyNewPwd(""); setMyNewPwd2("");
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "users",      label: "👥 USUARIOS" },
    { id: "create",     label: "➕ NUEVO USUARIO" },
    { id: "signals",    label: "📡 SEÑALES" },
    { id: "canales",    label: "📺 CANALES" },
    { id: "precios",    label: "💰 PRECIOS & PAGOS" },
    { id: "myaccount",  label: "⚙️ MI CUENTA" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0d1520", border: "1px solid #00e5ff33", borderRadius: 8, width: "100%", maxWidth: 860, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#ffd700,#00e5ff,#e040fb)", flexShrink: 0 }} />

        <div style={{ padding: "20px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, letterSpacing: 3, color: "#ffd700" }}>★ PANEL DE ADMINISTRACIÓN</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a7a9b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 0, padding: "12px 28px 0", flexShrink: 0, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "#002233" : "transparent",
              border: "none", borderBottom: `2px solid ${tab === t.id ? "#00e5ff" : "transparent"}`,
              color: tab === t.id ? "#00e5ff" : "#4a7a9b",
              padding: "10px 16px", cursor: "pointer", fontSize: 11,
              letterSpacing: 1, fontFamily: "'Rajdhani', sans-serif", transition: "all .2s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ height: 1, background: "#1a3a4a", flexShrink: 0 }} />

        {msg && (
          <div style={{ margin: "12px 28px 0", padding: "10px 16px", borderRadius: 4, background: msg.type === "ok" ? "#00e6760d" : "#ff17440d", border: `1px solid ${msg.type === "ok" ? "#00e67633" : "#ff174433"}`, color: msg.type === "ok" ? "#00e676" : "#ff6b6b", fontSize: 13, flexShrink: 0 }}>{msg.text}</div>
        )}

        <div style={{ overflow: "auto", padding: "20px 28px 28px", flex: 1 }}>

          {/* ── USUARIOS ─────────────────────────────────────────────────── */}
          {tab === "users" && (
            <div>
              <div style={{ fontSize: 12, color: "#4a7a9b", marginBottom: 16, letterSpacing: 1 }}>
                {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
              </div>
              {users.map(u => (
                <div key={u.id} style={{ background: "#060a0f", border: `1px solid ${u.id === currentUser.id ? "#ffd70033" : "#1a3a4a"}`, borderRadius: 6, padding: "16px 20px", marginBottom: 10, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ color: "#e0f4ff", fontSize: 15, fontWeight: 600, fontFamily: "'Share Tech Mono', monospace" }}>
                      {u.username}{u.id === currentUser.id && <span style={{ color: "#ffd700", fontSize: 10, marginLeft: 8 }}>★ TÚ</span>}
                    </div>
                    {u.displayName && u.displayName !== u.username && <div style={{ color: "#4a7a9b", fontSize: 12 }}>{u.displayName}</div>}
                    <div style={{ color: "#2a4a5a", fontSize: 11, marginTop: 2 }}>Desde {u.createdAt}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value as UserRole)} disabled={u.id === currentUser.id} style={{ width: "auto", fontSize: 12, padding: "6px 10px" }}>
                      {(["ADMIN","PRO","BÁSICO"] as UserRole[]).map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                    <div style={{ padding: "4px 10px", borderRadius: 3, fontSize: 10, letterSpacing: 1, background: `${ROLE_META[u.role].color}1a`, border: `1px solid ${ROLE_META[u.role].color}44`, color: ROLE_META[u.role].color }}>{ROLE_META[u.role].label}</div>
                  </div>
                  {u.id !== currentUser.id && (
                    confirmDelete === u.id
                      ? <div style={{ display: "flex", gap: 8 }}><BTN variant="danger" onClick={() => handleDelete(u.id)}>Confirmar</BTN><BTN onClick={() => setConfirmDelete(null)}>Cancelar</BTN></div>
                      : <BTN variant="danger" onClick={() => setConfirmDelete(u.id)}>🗑 Eliminar</BTN>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── NUEVO USUARIO ────────────────────────────────────────────── */}
          {tab === "create" && (
            <div style={{ maxWidth: 480 }}>
              <p style={{ color: "#4a7a9b", fontSize: 13, marginBottom: 24 }}>Los usuarios recibirán su contraseña directamente.</p>
              <div style={{ display: "grid", gap: 16 }}>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nombre de Usuario</label><Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ej: TRADER-001" /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nombre para Mostrar (opcional)</label><Input value={newDisplay} onChange={e => setNewDisplay(e.target.value)} placeholder="ej: Juan Pérez" /></div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Contraseña</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ flex: 1 }} />
                    <BTN variant="ghost" onClick={() => setNewPassword(generatePassword())} style={{ whiteSpace: "nowrap" }}>🔀 Generar</BTN>
                  </div>
                </div>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nivel de Acceso</label>
                  <Select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>{(["ADMIN","PRO","BÁSICO"] as UserRole[]).map(r => <option key={r} value={r}>{r} — {ROLE_META[r].desc}</option>)}</Select>
                </div>
                <div style={{ background: "#00e5ff0d", border: "1px solid #00e5ff22", borderRadius: 4, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, color: "#4a7a9b", marginBottom: 4 }}>CREDENCIALES A ENTREGAR:</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#00e5ff" }}>Usuario: {newUsername.toUpperCase() || "—"}<br/>Contraseña: {newPassword}</div>
                </div>
                <BTN variant="primary" onClick={handleCreate} style={{ padding: "12px" }}>➕ CREAR USUARIO</BTN>
              </div>
            </div>
          )}

          {/* ── SEÑALES ──────────────────────────────────────────────────── */}
          {tab === "signals" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

                {/* Composer */}
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontSize: 12, color: "#00e5ff", letterSpacing: 2, marginBottom: 4 }}>COMPONER SEÑAL</div>

                  {/* Destino */}
                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Destino</label>
                    <Select value={sigTarget} onChange={e => setSigTarget(e.target.value)}>
                      <option value="all">📢 TODOS LOS CANALES</option>
                      {channelList.filter(c => c.active).map(c => (
                        <option key={c.slug} value={c.slug}>
                          {c.name} (@{c.channelId.replace("@","")})
                        </option>
                      ))}
                    </Select>
                    {channelList.length === 0 && (
                      <div style={{ fontSize: 10, color: "#4a7a9b", marginTop: 4 }}>
                        → Configurá canales en la pestaña 📺 CANALES primero
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Activo</label>
                    <Select value={sigAsset} onChange={e => setSigAsset(e.target.value)}>
                      {["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XAU/USD","ETH/BTC","TOTAL3"].map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Dirección</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["LONG","SHORT"] as const).map(d => (
                        <button key={d} onClick={() => setSigDir(d)} style={{
                          flex: 1, padding: 10,
                          border: `1px solid ${sigDir === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#1a3a4a"}`,
                          background: sigDir === d ? `${d === "LONG" ? "#00e676" : "#ff1744"}1a` : "#060a0f",
                          color: sigDir === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#4a7a9b",
                          cursor: "pointer", fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 2, borderRadius: 4, transition: "all .2s",
                        }}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Entrada *</label><Input value={sigEntry} onChange={e => setSigEntry(e.target.value)} placeholder="76,800" /></div>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Stop Loss *</label><Input value={sigSl} onChange={e => setSigSl(e.target.value)} placeholder="74,200" /></div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>TP1 *</label><Input value={sigTp1} onChange={e => setSigTp1(e.target.value)} placeholder="79,500" /></div>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>TP2</label><Input value={sigTp2} onChange={e => setSigTp2(e.target.value)} placeholder="82,400" /></div>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>TP3</label><Input value={sigTp3} onChange={e => setSigTp3(e.target.value)} placeholder="86,000" /></div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>R/R</label><Input value={sigRr} onChange={e => setSigRr(e.target.value)} placeholder="1:3.4" /></div>
                    <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Apalancamiento</label>
                      <Select value={sigLev} onChange={e => setSigLev(e.target.value)}>
                        {["Sin apalancamiento","2x","3x","4x","5x","7x","10x","20x"].map(l => <option key={l} value={l}>{l}</option>)}
                      </Select>
                    </div>
                  </div>

                  <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Fuente</label>
                    <Select value={sigSource} onChange={e => setSigSource(e.target.value as "PSY BOT"|"ANÁLISIS IA"|"MANUAL")}>
                      {["PSY BOT","ANÁLISIS IA","MANUAL"].map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nota / Análisis</label>
                    <textarea value={sigNote} onChange={e => setSigNote(e.target.value)} rows={3}
                      placeholder="Order block diario confirmado..."
                      style={{ background: "#060a0f", border: "1px solid #1a3a4a", borderRadius: 4, padding: "10px 12px", color: "#e0f4ff", fontSize: 13, outline: "none", fontFamily: "'Share Tech Mono', monospace", width: "100%", boxSizing: "border-box" as const, resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>

                  <BTN variant="primary" onClick={handlePublishSignal} disabled={sigBusy} style={{ padding: "13px", fontSize: 13 }}>
                    {sigBusy ? "⏳ PUBLICANDO..." : `📡 PUBLICAR${sigTarget === "all" ? " EN TODOS LOS CANALES" : " EN CANAL"}`}
                  </BTN>
                </div>

                {/* Preview */}
                <div>
                  <div style={{ fontSize: 12, color: "#00e5ff", letterSpacing: 2, marginBottom: 10 }}>VISTA PREVIA</div>
                  <div style={{ background: "#060a0f", border: "1px solid #1a3a4a", borderRadius: 6, padding: 16, fontFamily: "'Share Tech Mono', monospace", fontSize: 12, lineHeight: 2, color: "#e0f4ff", whiteSpace: "pre-wrap", minHeight: 260 }}>
                    {`⚡ SEÑAL PSYCHOMETRIKS\n\n${sigDir === "LONG" ? "🟢" : "🔴"} ${sigAsset} — ${sigDir}\n\n🎯 Entrada: ${sigEntry || "—"}\n✅ TP1: ${sigTp1 || "—"}${sigTp2 ? `\n✅ TP2: ${sigTp2}` : ""}${sigTp3 ? `\n✅ TP3: ${sigTp3}` : ""}\n🛑 Stop: ${sigSl || "—"}\n\n${sigRr ? `⚖️ R/R: ${sigRr}  ·  ` : ""}📈 ${sigLev}${sigNote ? `\n\n📝 ${sigNote}` : ""}\n\n⚠️ Solo educativo.\n\n#${sigAsset.replace("/","")} #${sigDir} #Psychometriks`}
                  </div>

                  {/* Canal destino indicator */}
                  {sigTarget !== "all" && channelList.find(c => c.slug === sigTarget) && (() => {
                    const ch = channelList.find(c => c.slug === sigTarget)!;
                    return (
                      <div style={{ marginTop: 10, padding: "10px 14px", background: `${ch.color}0d`, border: `1px solid ${ch.color}33`, borderRadius: 4, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color }} />
                        <div style={{ fontSize: 11, color: ch.color }}>{ch.name}</div>
                        <div style={{ fontSize: 10, color: "#4a7a9b", marginLeft: "auto" }}>{ch.channelId}</div>
                      </div>
                    );
                  })()}
                  {sigTarget === "all" && channelList.filter(c => c.active).length > 0 && (
                    <div style={{ marginTop: 10, padding: "10px 14px", background: "#00e5ff0a", border: "1px solid #00e5ff22", borderRadius: 4 }}>
                      <div style={{ fontSize: 10, color: "#00e5ff", letterSpacing: 1, marginBottom: 6 }}>SE ENVIARÁ A:</div>
                      {channelList.filter(c => c.active).map(c => (
                        <div key={c.slug} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
                          <span style={{ fontSize: 11, color: "#e0f4ff" }}>{c.name}</span>
                          <span style={{ fontSize: 10, color: "#4a7a9b" }}>{c.channelId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              <div>
                <div style={{ fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 10 }}>SEÑALES PUBLICADAS ({sigHistory.length})</div>
                {sigHistory.length === 0
                  ? <div style={{ color: "#2a4a5a", fontSize: 12, padding: "16px 0" }}>No hay señales publicadas todavía</div>
                  : sigHistory.map((s, i) => {
                    const ch = channelList.find(c => c.slug === s.channelSlug);
                    return (
                      <div key={i} style={{ background: "#060a0f", border: `1px solid ${ch ? ch.color + "33" : "#1a3a4a"}`, borderRadius: 4, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {ch && <div style={{ width: 6, height: 6, borderRadius: "50%", background: ch.color, flexShrink: 0 }} />}
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: s.direction === "LONG" ? "#00e676" : "#ff1744", fontFamily: "'Orbitron', monospace" }}>{s.direction}</div>
                        <div style={{ color: "#e0f4ff", fontSize: 13 }}>{s.asset}</div>
                        {ch && <div style={{ fontSize: 10, color: ch.color }}>{ch.name}</div>}
                        <div style={{ color: "#4a7a9b", fontSize: 11 }}>En: {s.entry}</div>
                        {s.tp1 && <div style={{ color: "#4a7a9b", fontSize: 11 }}>TP1: {s.tp1}</div>}
                        {s.sl  && <div style={{ color: "#4a7a9b", fontSize: 11 }}>SL: {s.sl}</div>}
                        <div style={{ marginLeft: "auto", color: "#2a4a5a", fontSize: 10 }}>{new Date(s.ts).toLocaleString("es-EC")}</div>
                        <button onClick={() => handleDeleteSignal(s.id)} style={{ background: "none", border: "1px solid #ff174433", color: "#ff174466", cursor: "pointer", borderRadius: 3, padding: "3px 8px", fontSize: 11 }}>✕</button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── CANALES ──────────────────────────────────────────────────── */}
          {tab === "canales" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#00e5ff", letterSpacing: 2 }}>GESTIÓN DE CANALES TELEGRAM</div>
                  <div style={{ fontSize: 11, color: "#4a7a9b", marginTop: 4 }}>Cada canal publica sus señales en su propia sección de la página</div>
                </div>
                <BTN variant="teal" onClick={() => setEditingCh({ color: "#00e5ff", active: true })}>➕ NUEVO CANAL</BTN>
              </div>

              {channelsLoading && <div style={{ color: "#4a7a9b", fontSize: 12 }}>Cargando canales...</div>}

              {!channelsLoading && channelList.length === 0 && !editingCh && (
                <div style={{ background: "#060a0f", border: "1px dashed #1a3a4a", borderRadius: 6, padding: 32, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📺</div>
                  <div style={{ color: "#4a7a9b", fontSize: 13, marginBottom: 16 }}>No hay canales configurados todavía</div>
                  <BTN variant="teal" onClick={() => setEditingCh({ color: "#00e5ff", active: true })}>➕ AGREGAR PRIMER CANAL</BTN>
                </div>
              )}

              {/* Channel list */}
              {channelList.map(ch => (
                <div key={ch.id} style={{ background: "#060a0f", border: `1px solid ${ch.active ? ch.color + "44" : "#1a3a4a"}`, borderRadius: 6, padding: "16px 20px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: ch.active ? ch.color : "#2a4a5a", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#e0f4ff", fontSize: 14, fontWeight: 600 }}>{ch.name}</span>
                        <span style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "'Share Tech Mono', monospace" }}>/{ch.slug}</span>
                        {!ch.active && <span style={{ fontSize: 10, color: "#ff1744", border: "1px solid #ff174433", padding: "1px 6px" }}>INACTIVO</span>}
                      </div>
                      {ch.description && <div style={{ color: "#4a7a9b", fontSize: 11, marginTop: 2 }}>{ch.description}</div>}
                      <div style={{ color: "#2a4a5a", fontSize: 11, marginTop: 3, fontFamily: "'Share Tech Mono', monospace" }}>{ch.channelId}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <BTN variant="ghost" onClick={() => setEditingCh({ ...ch })} style={{ fontSize: 10, padding: "6px 12px" }}>✏️ Editar</BTN>
                      <BTN variant={ch.active ? "ghost" : "teal"} onClick={() => handleToggleChannel(ch)} style={{ fontSize: 10, padding: "6px 12px" }}>
                        {ch.active ? "⏸ Pausar" : "▶ Activar"}
                      </BTN>
                      {confirmDelCh === ch.id
                        ? <div style={{ display: "flex", gap: 6 }}><BTN variant="danger" onClick={() => handleDeleteChannel(ch.id)} style={{ fontSize: 10, padding: "6px 10px" }}>Confirmar</BTN><BTN onClick={() => setConfirmDelCh(null)} style={{ fontSize: 10, padding: "6px 10px" }}>Cancelar</BTN></div>
                        : <BTN variant="danger" onClick={() => setConfirmDelCh(ch.id)} style={{ fontSize: 10, padding: "6px 10px" }}>🗑</BTN>
                      }
                    </div>
                  </div>
                </div>
              ))}

              {/* Form nuevo / editar canal */}
              {editingCh && (
                <div style={{ background: "#060a0f", border: "1px solid #00e5ff33", borderRadius: 6, padding: 24, marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#00e5ff", letterSpacing: 2, marginBottom: 20 }}>
                    {editingCh.id ? "EDITAR CANAL" : "NUEVO CANAL"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nombre del Canal *</label>
                      <Input value={editingCh.name ?? ""} onChange={e => setEditingCh(c => ({ ...c!, name: e.target.value }))} placeholder="ej: Crypto Señales PRO" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Slug (ID único) *</label>
                      <Input value={editingCh.slug ?? ""} onChange={e => setEditingCh(c => ({ ...c!, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"") }))} placeholder="ej: crypto-pro" disabled={!!editingCh.id} style={{ opacity: editingCh.id ? 0.5 : 1 }} />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Descripción</label>
                      <Input value={editingCh.description ?? ""} onChange={e => setEditingCh(c => ({ ...c!, description: e.target.value }))} placeholder="ej: Señales de altcoins con alto R/R" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Bot Token {editingCh.id ? "(dejar vacío = sin cambios)" : "*"}</label>
                      <Input type="password" value={editingCh.botToken ?? ""} onChange={e => setEditingCh(c => ({ ...c!, botToken: e.target.value }))} placeholder="7123456789:AAH..." />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Channel ID / Username *</label>
                      <Input value={editingCh.channelId ?? ""} onChange={e => setEditingCh(c => ({ ...c!, channelId: e.target.value }))} placeholder="@psychometriks_pro o -100123456789" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Color del canal</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {CHANNEL_COLORS.map(col => (
                          <button key={col} onClick={() => setEditingCh(c => ({ ...c!, color: col }))}
                            style={{ width: 28, height: 28, borderRadius: "50%", background: col, border: editingCh.color === col ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ fontSize: 10, color: "#4a7a9b", letterSpacing: 2, textTransform: "uppercase" }}>Estado</label>
                      <button onClick={() => setEditingCh(c => ({ ...c!, active: !c!.active }))}
                        style={{ padding: "6px 14px", fontSize: 11, borderRadius: 4, border: `1px solid ${editingCh.active ? "#00e676" : "#ff1744"}`, background: "transparent", color: editingCh.active ? "#00e676" : "#ff1744", cursor: "pointer" }}>
                        {editingCh.active ? "✅ Activo" : "⏸ Inactivo"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <BTN variant="teal" onClick={handleSaveChannel} disabled={chBusy} style={{ flex: 1, padding: "11px" }}>
                      {chBusy ? "⏳ GUARDANDO..." : (editingCh.id ? "💾 ACTUALIZAR CANAL" : "✅ CREAR CANAL")}
                    </BTN>
                    <BTN variant="ghost" onClick={() => setEditingCh(null)} style={{ padding: "11px 20px" }}>Cancelar</BTN>
                  </div>
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#0a1020", border: "1px solid #1a3a4a", borderRadius: 4, fontSize: 11, color: "#4a7a9b", lineHeight: 1.7 }}>
                    💡 El Bot Token lo obtenés de <span style={{ color: "#e0f4ff" }}>@BotFather</span> → /newbot. El Channel ID puede ser el @username público del canal o el ID numérico (ej: -1001234567890). El bot debe ser administrador del canal con permiso de publicar.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PRECIOS & PAGOS ──────────────────────────────────────────── */}
          {tab === "precios" && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ background: "#0d1a0d", border: "1px solid #00e67622", borderRadius: 4, padding: "12px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "#00e676", letterSpacing: 2, marginBottom: 4 }}>💡 CÓMO FUNCIONA</div>
                <div style={{ fontSize: 12, color: "#4a7a9b", lineHeight: 1.6 }}>Los valores que guardes aquí se aplican automáticamente en la landing page. Comparten el mismo almacenamiento del navegador.</div>
              </div>
              <div style={{ display: "grid", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#ffd700", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>📦 Precios Mensuales (USD)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {(["basic","pro","elite"] as const).map(k => (
                      <div key={k}>
                        <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>{k.toUpperCase()}</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#00e5ff", fontSize: 13 }}>$</span>
                          <Input type="number" min="1" value={landingCfg.prices[k]} onChange={e => setLandingCfg(c => ({ ...c, prices: { ...c.prices, [k]: e.target.value } }))} style={{ paddingLeft: 24 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ height: 1, background: "#1a3a4a" }} />
                <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>💳 Email de PayPal</label><Input value={landingCfg.paypal} onChange={e => setLandingCfg(c => ({ ...c, paypal: e.target.value }))} placeholder="tu-email@paypal.com" /></div>
                <div><label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>🟡 Usuario de Binance Pay</label><Input value={landingCfg.binance} onChange={e => setLandingCfg(c => ({ ...c, binance: e.target.value }))} placeholder="tu_usuario_binance" /></div>
                <div>
                  <label style={{ display: "block", fontSize: 10, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>🏦 Datos Bancarios</label>
                  <textarea value={landingCfg.bank} onChange={e => setLandingCfg(c => ({ ...c, bank: e.target.value }))} rows={4}
                    style={{ background: "#060a0f", border: "1px solid #1a3a4a", borderRadius: 4, padding: "10px 12px", color: "#e0f4ff", fontSize: 13, outline: "none", fontFamily: "'Share Tech Mono', monospace", width: "100%", boxSizing: "border-box" as const, resize: "vertical", lineHeight: 1.6 }}
                    placeholder={"Banco XYZ\nCuenta: 123456\nNombre: TU NOMBRE"} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <BTN variant="gold" onClick={handleLandingSave} style={{ flex: 1, padding: "12px" }}>💾 GUARDAR CAMBIOS</BTN>
                  <BTN variant="ghost" onClick={handleLandingReset} style={{ padding: "12px 16px" }}>Resetear</BTN>
                </div>
              </div>
            </div>
          )}

          {/* ── MI CUENTA ─────────────────────────────────────────────────── */}
          {tab === "myaccount" && (
            <div style={{ maxWidth: 480 }}>
              <p style={{ color: "#4a7a9b", fontSize: 13, marginBottom: 24 }}>Modificá tus datos de acceso.</p>
              <div style={{ display: "grid", gap: 16 }}>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nombre de Usuario</label><Input value={myUsername} onChange={e => setMyUsername(e.target.value)} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nombre para Mostrar</label><Input value={myDisplayName} onChange={e => setMyDisplayName(e.target.value)} /></div>
                <div style={{ height: 1, background: "#1a3a4a" }} />
                <div style={{ fontSize: 12, color: "#00e5ff", letterSpacing: 1 }}>CAMBIAR CONTRASEÑA (opcional)</div>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Contraseña Actual</label><Input type="password" value={myOldPwd} onChange={e => setMyOldPwd(e.target.value)} placeholder="••••••••" /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nueva Contraseña</label><Input type="password" value={myNewPwd} onChange={e => setMyNewPwd(e.target.value)} placeholder="••••••••" /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Confirmar Nueva Contraseña</label><Input type="password" value={myNewPwd2} onChange={e => setMyNewPwd2(e.target.value)} placeholder="••••••••" /></div>
                <BTN variant="gold" onClick={handleMyAccount} style={{ padding: "12px" }}>★ GUARDAR CAMBIOS</BTN>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
