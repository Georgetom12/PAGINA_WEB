import React, { useState } from "react";
import { User, updateUser } from "../auth/types";

interface Props {
  currentUser: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    style={{
      background: "#060a0f", border: "1px solid #1a3a4a", borderRadius: 4,
      padding: "11px 14px", color: "#e0f4ff", fontSize: 14, outline: "none",
      fontFamily: "'Share Tech Mono', monospace", width: "100%", boxSizing: "border-box" as const,
      ...props.style,
    }}
  />
);

export function ChangePasswordPage({ currentUser, onClose, onUserUpdated }: Props) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const flash = (text: string, type: "ok" | "err" = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSave = () => {
    if (oldPwd !== currentUser.password) { flash("Contraseña actual incorrecta", "err"); return; }
    if (!newPwd) { flash("Ingresá la nueva contraseña", "err"); return; }
    if (newPwd !== newPwd2) { flash("Las contraseñas no coinciden", "err"); return; }
    if (newPwd.length < 6) { flash("Mínimo 6 caracteres", "err"); return; }
    updateUser(currentUser.id, { password: newPwd });
    onUserUpdated({ ...currentUser, password: newPwd });
    flash("¡Contraseña actualizada!");
    setOldPwd(""); setNewPwd(""); setNewPwd2("");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#0d1520", border: "1px solid #00e5ff33",
        borderRadius: 8, width: "100%", maxWidth: 420, overflow: "hidden",
      }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#00e5ff,#e040fb)" }} />
        <div style={{ padding: "24px 28px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: 3, color: "#00e5ff" }}>
              CAMBIAR CONTRASEÑA
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a7a9b", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
          <p style={{ color: "#4a7a9b", fontSize: 13, marginBottom: 20 }}>
            Usuario: <span style={{ color: "#e0f4ff", fontFamily: "'Share Tech Mono', monospace" }}>{currentUser.username}</span>
          </p>
          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 4, marginBottom: 16,
              background: msg.type === "ok" ? "#00e6760d" : "#ff17440d",
              border: `1px solid ${msg.type === "ok" ? "#00e67633" : "#ff174433"}`,
              color: msg.type === "ok" ? "#00e676" : "#ff6b6b", fontSize: 13,
            }}>{msg.text}</div>
          )}
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Contraseña Actual</label>
              <Input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nueva Contraseña</label>
              <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#4a7a9b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Confirmar Nueva Contraseña</label>
              <Input type="password" value={newPwd2} onChange={e => setNewPwd2(e.target.value)} placeholder="••••••••" />
            </div>
            <button onClick={handleSave} style={{
              background: "#002233", border: "1px solid #00e5ff", borderRadius: 4,
              color: "#00e5ff", padding: "12px", fontSize: 12, letterSpacing: 3,
              textTransform: "uppercase", cursor: "pointer", fontFamily: "'Orbitron', monospace",
            }}>
              GUARDAR CONTRASEÑA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
