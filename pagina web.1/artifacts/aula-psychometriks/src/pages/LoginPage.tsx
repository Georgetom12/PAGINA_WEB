import React, { useState } from "react";
import { login, User } from "../auth/types";

interface Props {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError("Usuario o contraseña incorrectos");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#060a0f", fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, padding: "0 20px",
      }}>
        <div style={{
          background: "#0d1520", border: "1px solid #00e5ff33",
          borderRadius: 8, padding: "48px 40px", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #00e5ff, #e040fb, #00e676, #ffd700, #00e5ff)",
          }} />

          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              fontFamily: "'Orbitron', monospace", fontSize: 22, letterSpacing: 4,
              color: "#00e5ff", marginBottom: 6,
            }}>PSYCHOMETRIKS</div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#4a7a9b", textTransform: "uppercase" }}>
              ○ AULA VIRTUAL ○ ACCESO RESTRINGIDO
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: "block", fontSize: 11, letterSpacing: 2,
                color: "#4a7a9b", marginBottom: 8, textTransform: "uppercase",
              }}>USUARIO</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario"
                autoComplete="username"
                style={{
                  width: "100%", background: "#060a0f", border: "1px solid #1a3a4a",
                  borderRadius: 4, padding: "12px 14px", color: "#e0f4ff",
                  fontSize: 15, outline: "none", boxSizing: "border-box",
                  fontFamily: "'Share Tech Mono', monospace",
                  transition: "border-color .2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#00e5ff"}
                onBlur={(e) => e.target.style.borderColor = "#1a3a4a"}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block", fontSize: 11, letterSpacing: 2,
                color: "#4a7a9b", marginBottom: 8, textTransform: "uppercase",
              }}>CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%", background: "#060a0f", border: "1px solid #1a3a4a",
                  borderRadius: 4, padding: "12px 14px", color: "#e0f4ff",
                  fontSize: 15, outline: "none", boxSizing: "border-box",
                  fontFamily: "'Share Tech Mono', monospace",
                  transition: "border-color .2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#00e5ff"}
                onBlur={(e) => e.target.style.borderColor = "#1a3a4a"}
              />
            </div>

            {error && (
              <div style={{
                background: "#ff17440d", border: "1px solid #ff174433",
                borderRadius: 4, padding: "10px 14px", marginBottom: 16,
                color: "#ff6b6b", fontSize: 13, letterSpacing: 1,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                width: "100%", background: loading ? "#0d2a3a" : "#002233",
                border: "1px solid #00e5ff", borderRadius: 4,
                padding: "14px", color: "#00e5ff", fontSize: 13,
                letterSpacing: 3, textTransform: "uppercase",
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'Orbitron', monospace", transition: "all .2s",
              }}
            >
              {loading ? "○ VERIFICANDO..." : "○ ACCEDER AL SISTEMA"}
            </button>
          </form>

          <div style={{
            marginTop: 28, textAlign: "center", fontSize: 11,
            color: "#2a4a5a", letterSpacing: 1,
          }}>
            🔒 PSYCHOMETRIKS — Plataforma educativa de trading profesional
          </div>
        </div>
      </div>
    </div>
  );
}
