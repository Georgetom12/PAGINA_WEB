import React, { useState, useEffect, useCallback, useRef } from "react";
import SiteNav from "@/components/site-nav";

// ─── BIP39-style wordlist (256 words) ────────────────────────────────────────
const WORDS = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis".split(" ");

// ─── Crypto helpers (all client-side, nothing goes to server) ─────────────────
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode("PSY_VAULT_v1_" + pin);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function deriveKey(pin: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(pin.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptData(data: string, pin: string): Promise<string> {
  const key = await deriveKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(data));
  const out = new Uint8Array(12 + enc.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(enc), 12);
  return btoa(String.fromCharCode(...out));
}

async function decryptData(cipherb64: string, pin: string): Promise<string> {
  const bytes = Uint8Array.from(atob(cipherb64), c => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const key = await deriveKey(pin);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plain);
}

function generateSeedPhrase(): string {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => WORDS[b % WORDS.length]).join(" ");
}

function generatePrivateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateRecoveryKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join("").replace(/(.{6})/g, "$1-").slice(0, 29);
}

function privateKeyToAddress(pk: string): string {
  const hex = pk.slice(2);
  return "0x" + hex.slice(0, 4) + "·".repeat(3) + hex.slice(-4);
}

// ─── Per-user vault storage keys ──────────────────────────────────────────────
function getVaultUser(): string {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return "guest";
    const s = JSON.parse(raw) as { user?: string };
    return (s.user ?? "guest").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  } catch { return "guest"; }
}

function makeStore(u: string) {
  return {
    PIN_HASH:     `psyv_${u}_pin`,
    SEED_ENC:     `psyv_${u}_seed`,
    KEY_ENC:      `psyv_${u}_key`,
    RECOVERY_ENC: `psyv_${u}_rec`,
    TOTP_SECRET:  `psyv_${u}_totp`,
    TOTP_ENABLED: `psyv_${u}_totp_ok`,
    CONNECTED:    `psyv_${u}_connected`,
    ADDRESS:      `psyv_${u}_addr`,
  };
}

type VaultPhase = "welcome" | "create-pin" | "confirm-pin" | "seed-reveal" | "locked" | "unlocked";
type VaultTab   = "wallet" | "seed" | "key" | "totp" | "recovery" | "backup";

// ─── Backup export / import ───────────────────────────────────────────────────
async function exportVault(store: Record<string, string>, pin: string): Promise<void> {
  const bundle: Record<string, string> = {};
  for (const [k, lsKey] of Object.entries(store)) {
    const v = localStorage.getItem(lsKey);
    if (v !== null) bundle[k] = v;
  }
  const json = JSON.stringify({ version: 1, ts: Date.now(), data: bundle });
  const encrypted = await encryptData(json, pin);
  const blob = new Blob([encrypted], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `psyvault-backup-${new Date().toISOString().slice(0, 10)}.psyv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importVault(
  file: File,
  pin: string,
  store: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const text = await file.text();
    const json = await decryptData(text.trim(), pin);
    const parsed = JSON.parse(json) as { version?: number; data?: Record<string, string> };
    if (!parsed.data) return { ok: false, error: "Formato de archivo no válido" };
    for (const [k, v] of Object.entries(parsed.data)) {
      const lsKey = (store as Record<string, string>)[k];
      if (lsKey) localStorage.setItem(lsKey, v);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "PIN incorrecto o archivo corrupto" };
  }
}

// ─── PIN Keypad ───────────────────────────────────────────────────────────────
function PinKeypad({
  digits, onDigit, onDelete, processing, shake,
}: {
  digits: string;
  onDigit: (d: string) => void;
  onDelete: () => void;
  processing: boolean;
  shake: boolean;
}) {
  return (
    <div>
      {/* Dots */}
      <div className="flex gap-3 justify-center mb-6">
        {[0,1,2,3,4,5].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border transition-all duration-200 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}
            style={{
              borderColor: digits.length > i ? "#00e5ff" : "#1a2535",
              background:  digits.length > i ? "#00e5ff" : "transparent",
              boxShadow:   digits.length > i ? "0 0 8px #00e5ff60" : "none",
            }}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
          k === "" ? <div key={i} /> :
          <button
            key={i}
            disabled={processing || (k !== "⌫" && digits.length >= 6)}
            onClick={() => k === "⌫" ? onDelete() : onDigit(k)}
            className="h-14 rounded-lg border border-[#1a2535] bg-[#060a0f] font-bebas text-2xl text-white hover:border-[#00e5ff44] hover:bg-[#00e5ff08] hover:text-[#00e5ff] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >{k}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Vault icon header ────────────────────────────────────────────────────────
function VaultHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 rounded-full border-2 border-[#00e5ff44] bg-[#00e5ff08] flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
          <rect x="4" y="10" width="32" height="24" rx="3" stroke="#00e5ff" strokeWidth="1.5"/>
          <circle cx="20" cy="22" r="5" stroke="#00e5ff" strokeWidth="1.5"/>
          <line x1="20" y1="10" x2="20" y2="6" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="20" cy="22" r="2" fill="#00e5ff"/>
          <line x1="28" y1="22" x2="31" y2="22" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="font-bebas text-4xl text-white mb-1">PSY<span className="text-[#00e5ff]">VAULT</span></div>
      <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em]">{subtitle}</div>
    </div>
  );
}

// ─── Reset Vault Button ───────────────────────────────────────────────────────
function ResetVaultButton() {
  const [confirm, setConfirm] = React.useState(false);
  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)}
        className="font-space text-[9px] text-[#5a8898] hover:text-[#ff1744] transition-colors tracking-[0.1em] underline underline-offset-2">
        ¿Olvidaste tu PIN? Resetear Bóveda
      </button>
    );
  }
  return (
    <div className="border border-[#ff174433] bg-[#ff174408] p-3 text-center space-y-2">
      <div className="font-space text-[9px] text-[#ff1744] tracking-[0.1em]">
        ⚠️ ESTO BORRA TODA LA INFORMACIÓN DE LA BÓVEDA
      </div>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => {
            const u = getVaultUser();
            const store = makeStore(u);
            Object.values(store).forEach(k => localStorage.removeItem(k));
            window.location.reload();
          }}
          className="font-space text-[9px] px-4 py-1.5 border border-[#ff174466] text-[#ff1744] hover:bg-[#ff174422] transition-colors">
          CONFIRMAR RESET
        </button>
        <button onClick={() => setConfirm(false)}
          className="font-space text-[9px] px-4 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:text-white transition-colors">
          CANCELAR
        </button>
      </div>
    </div>
  );
}

// ─── Masked field ─────────────────────────────────────────────────────────────
function MaskedField({ label, value, mono = true, wordMode = false }: {
  label: string; value: string; mono?: boolean; wordMode?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (wordMode) {
    const words = value.split(" ");
    return (
      <div className="border border-[#1a2535] bg-[#060a0f] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] uppercase">{label}</div>
          <div className="flex gap-2">
            <button onClick={copy} className="font-space text-[9px] text-[#5a8898] hover:text-[#00e5ff] transition-colors">
              {copied ? "✓ COPIADO" : "COPIAR"}
            </button>
            <button onClick={() => setRevealed(r => !r)}
              className="font-space text-[9px] px-2 py-0.5 border transition-colors"
              style={{ borderColor: revealed ? "#ff174444" : "#00e5ff44", color: revealed ? "#ff1744" : "#00e5ff" }}>
              {revealed ? "OCULTAR" : "REVELAR"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {words.map((w, i) => (
            <div key={i} className="flex items-center gap-2 border border-[#1a2535] px-2 py-1.5">
              <span className="font-space text-[8px] text-[#5a8898] w-4">{i+1}</span>
              <span className={`font-sharetech text-[11px] ${revealed ? "text-[#00e5ff]" : "text-transparent select-none"}`}
                style={revealed ? {} : { textShadow: "0 0 8px #00e5ff80", filter: "blur(4px)" }}>
                {revealed ? w : "•••••"}
              </span>
            </div>
          ))}
        </div>
        {!revealed && (
          <div className="mt-3 text-center font-space text-[9px] text-[#5a8898]">
            🔒 Haz click en REVELAR para ver las palabras semilla
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-[#1a2535] bg-[#060a0f] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] uppercase">{label}</div>
        <div className="flex gap-2">
          <button onClick={copy} className="font-space text-[9px] text-[#5a8898] hover:text-[#00e5ff] transition-colors">
            {copied ? "✓ COPIADO" : "COPIAR"}
          </button>
          <button onClick={() => setRevealed(r => !r)}
            className="font-space text-[9px] px-2 py-0.5 border transition-colors"
            style={{ borderColor: revealed ? "#ff174444" : "#00e5ff44", color: revealed ? "#ff1744" : "#00e5ff" }}>
            {revealed ? "OCULTAR" : "REVELAR"}
          </button>
        </div>
      </div>
      <div className={`${mono ? "font-sharetech" : "font-space"} text-[11px] break-all leading-relaxed transition-all`}
        style={{
          color: revealed ? "#00e5ff" : "transparent",
          textShadow: revealed ? "none" : "0 0 8px #00e5ff60",
          filter: revealed ? "none" : "blur(6px)",
          userSelect: revealed ? "text" : "none",
        }}>
        {value}
      </div>
    </div>
  );
}

// ─── TOTP Section ─────────────────────────────────────────────────────────────
const API_BASE = "https://hello-who-joremogollon.replit.app";

function TotpSection({ storedSecret, onSave }: { storedSecret: string; onSave: (s: string) => void }) {
  const [secret, setSecret]       = useState(storedSecret);
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [status, setStatus]       = useState<"idle"|"verifying"|"ok"|"fail">("idle");
  const [loading, setLoading]     = useState(false);
  const enabled = !!storedSecret;

  const setup = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/vault/totp/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "psy-user-" + getVaultUser() }),
      });
      const d = await r.json() as { secret: string; otpauthUrl: string };
      setSecret(d.secret);
      setOtpauthUrl(d.otpauthUrl);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  async function verify() {
    if (verifyCode.length !== 6) return;
    setStatus("verifying");
    try {
      const r = await fetch(`${API_BASE}/api/vault/totp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyCode, secret }),
      });
      const d = await r.json() as { valid: boolean };
      if (d.valid) { setStatus("ok"); onSave(secret); }
      else { setStatus("fail"); setVerifyCode(""); }
    } catch { setStatus("fail"); }
  }

  const qrUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=200x200&bgcolor=020408&color=00e5ff`
    : "";

  if (enabled && status !== "ok") {
    return (
      <div className="space-y-4">
        <div className="border border-[#00e67644] bg-[#00e67608] p-4 flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <div className="font-bebas text-xl text-[#00e676]">2FA ACTIVADO</div>
            <div className="font-space text-[10px] text-[#7ab3c8]">Google Authenticator vinculado correctamente</div>
          </div>
        </div>
        <div className="border border-[#1a2535] bg-[#060a0f] p-4">
          <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-2">CLAVE SECRETA TOTP</div>
          <div className="font-sharetech text-[11px] text-[#5a8898] break-all">{storedSecret}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!otpauthUrl && !secret ? (
        <div className="text-center py-8">
          <div className="font-bebas text-3xl text-[#5a8898] mb-4">CONFIGURA TU 2FA</div>
          <div className="font-space text-[11px] text-[#7ab3c8] max-w-md mx-auto mb-6 leading-relaxed">
            Vincula Google Authenticator a tu bóveda para una capa adicional de seguridad.
            Necesitarás el código de 6 dígitos cada vez que accedas a información sensible.
          </div>
          <button onClick={setup} disabled={loading}
            className="border border-[#00e5ff44] bg-[#00e5ff08] text-[#00e5ff] font-space text-[11px] tracking-[0.2em] px-8 py-3 hover:bg-[#00e5ff15] transition-all">
            {loading ? "GENERANDO..." : "CONFIGURAR GOOGLE AUTHENTICATOR"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-[#1a2535] bg-[#060a0f] p-6">
            <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-4">
              PASO 1 — ESCANEA CON GOOGLE AUTHENTICATOR
            </div>
            <div className="flex gap-6 items-start flex-wrap">
              <div className="border-2 border-[#00e5ff22] p-2 bg-[#020408]">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR 2FA" width={160} height={160} />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <div className="font-space text-[10px] text-[#5a8898]">Generando QR...</div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-space text-[9px] text-[#7ab3c8] mb-2">CLAVE MANUAL (si no puedes escanear)</div>
                <div className="font-sharetech text-[12px] text-[#00e5ff] break-all bg-[#020408] border border-[#1a2535] p-2 mb-3">
                  {secret}
                </div>
                <div className="font-space text-[9px] text-[#7ab3c8] leading-relaxed">
                  Abre Google Authenticator → + → Clave manual<br/>
                  Nombre: <span className="text-[#8a9ab0]">PSY VAULT</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#1a2535] bg-[#060a0f] p-4">
            <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-3">
              PASO 2 — INGRESA EL CÓDIGO DE 6 DÍGITOS PARA CONFIRMAR
            </div>
            <div className="flex gap-3">
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="flex-1 bg-[#020408] border border-[#1a2535] text-white font-sharetech text-xl text-center px-4 py-3 focus:outline-none focus:border-[#00e5ff44] tracking-[0.3em]"
              />
              <button onClick={verify} disabled={verifyCode.length !== 6 || status === "verifying"}
                className="px-6 border border-[#00e5ff44] text-[#00e5ff] font-space text-[11px] tracking-[0.1em] hover:bg-[#00e5ff08] transition-all disabled:opacity-50">
                {status === "verifying" ? "..." : "VERIFICAR"}
              </button>
            </div>
            {status === "ok" && (
              <div className="mt-2 font-space text-[10px] text-[#00e676]">✅ 2FA activado correctamente</div>
            )}
            {status === "fail" && (
              <div className="mt-2 font-space text-[10px] text-[#ff1744]">❌ Código incorrecto. Intenta de nuevo.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recovery Section ─────────────────────────────────────────────────────────
function RecoverySection({ recoveryKey }: { recoveryKey: string }) {
  const [copied, setCopied] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(recoveryKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function downloadAsFile() {
    const blob = new Blob(
      [`PSYCHOMETRIKS — CLAVE DE RECUPERACIÓN DE BÓVEDA\n\n${recoveryKey}\n\nGuarda este archivo en un lugar seguro y offline. Nunca lo compartas con nadie.`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "psychometriks-recovery-key.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="border border-[#ffd70044] bg-[#ffd70008] p-4">
        <div className="font-bebas text-xl text-[#ffd700] mb-2">⚠️ CLAVE DE RECUPERACIÓN</div>
        <div className="font-space text-[10px] text-[#8a9ab0] leading-relaxed">
          Esta clave es la única forma de recuperar tu bóveda si olvidas el PIN.
          Guárdala en un lugar seguro <strong>fuera de tu dispositivo</strong> (papel,
          gestor de contraseñas, USB cifrado). PSYCHOMETRIKS no puede recuperar
          claves perdidas — y por tu seguridad, <strong>esta clave nunca sale de tu
          navegador</strong>: no la enviamos ni la guardamos en ningún servidor.
        </div>
      </div>

      <MaskedField label="CLAVE DE RECUPERACIÓN" value={recoveryKey} />

      <div className="border border-[#1a2535] bg-[#060a0f] p-4">
        <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-4">GUARDAR CLAVE (100% LOCAL)</div>
        <div className="flex gap-2">
          <button onClick={copyToClipboard}
            className="flex-1 py-3 border border-[#00e5ff44] bg-[#00e5ff08] text-[#00e5ff] font-space text-[11px] tracking-[0.15em] hover:bg-[#00e5ff15] transition-all">
            {copied ? "✅ COPIADA" : "📋 COPIAR"}
          </button>
          <button onClick={downloadAsFile}
            className="flex-1 py-3 border border-[#00e676] bg-[#00e67608] text-[#00e676] font-space text-[11px] tracking-[0.15em] hover:bg-[#00e67615] transition-all">
            ⬇ DESCARGAR .TXT
          </button>
        </div>
        <div className="font-space text-[9px] text-[#5a8898] mt-3 leading-relaxed">
          Copia o descarga tu clave ahora — no la vamos a mostrar de nuevo por defecto.
          Todo esto ocurre dentro de tu navegador; nada se transmite a nuestros
          servidores ni a terceros (ni Telegram, ni email, ni WhatsApp).
        </div>
      </div>
    </div>
  );
}

// ─── Wallet Tab ────────────────────────────────────────────────────────────────
function WalletTab({ address, onConnect, totpEnabled }: {
  address: string;
  onConnect: (a: string) => void;
  totpEnabled: boolean;
}) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  async function connectMetaMask() {
    setConnecting(true); setError("");
    try {
      const eth = (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum;
      if (!eth) { setError("MetaMask no detectado. Instálalo en tu navegador."); setConnecting(false); return; }
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts[0]) onConnect(accounts[0]);
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code === 4001) setError("Conexión rechazada por el usuario.");
      else setError("Error al conectar MetaMask.");
    }
    setConnecting(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535]">
        {[
          { icon: "🔐", label: "PIN AES-256",  status: "ACTIVO",    color: "#00e676" },
          { icon: "🌱", label: "Semilla 12p",  status: "GUARDADA",  color: "#00e676" },
          { icon: "🔑", label: "Clave privada", status: "CIFRADA",  color: "#00e676" },
          { icon: "📱", label: "Google Auth",   status: totpEnabled ? "ACTIVO" : "PENDIENTE", color: totpEnabled ? "#00e676" : "#ffd700" },
        ].map(s => (
          <div key={s.label} className="bg-[#060a0f] p-4 text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-space text-[9px] text-[#7ab3c8] mb-1">{s.label}</div>
            <div className="font-bebas text-sm" style={{ color: s.color }}>{s.status}</div>
          </div>
        ))}
      </div>

      <div className="border border-[#1a2535] bg-[#060a0f] p-6">
        <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-4">BILLETERA EXTERNA (NON-CUSTODIAL)</div>
        {address ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 border border-[#00e67644] bg-[#00e67608] p-3">
              <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              <div>
                <div className="font-space text-[9px] text-[#7ab3c8]">CONECTADA VÍA METAMASK</div>
                <div className="font-sharetech text-[12px] text-[#00e5ff] break-all">{address}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#1a2535]">
              <div className="bg-[#060a0f] p-3 text-center">
                <div className="font-space text-[9px] text-[#7ab3c8] mb-1">RED</div>
                <div className="font-bebas text-lg text-white">Ethereum</div>
              </div>
              <div className="bg-[#060a0f] p-3 text-center">
                <div className="font-space text-[9px] text-[#7ab3c8] mb-1">TIPO</div>
                <div className="font-bebas text-lg text-[#00e5ff]">NON-CUSTODIAL</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">🦊</div>
            <div className="font-bebas text-2xl text-[#5a8898] mb-2">CONECTA TU METAMASK</div>
            <div className="font-space text-[10px] text-[#7ab3c8] mb-5 leading-relaxed max-w-md mx-auto">
              PSY VAULT es non-custodial — nunca tocamos tus fondos.<br/>
              Tus claves, tu crypto.
            </div>
            <button onClick={connectMetaMask} disabled={connecting}
              className="border border-[#ff774444] bg-[#ff774408] text-[#ff7744] font-space text-[11px] tracking-[0.2em] px-8 py-3 hover:bg-[#ff774415] transition-all flex items-center gap-2 mx-auto">
              🦊 {connecting ? "CONECTANDO..." : "CONECTAR METAMASK"}
            </button>
            {error && <div className="mt-3 font-space text-[10px] text-[#ff1744]">{error}</div>}
          </div>
        )}
      </div>

      <div className="border-l-2 border-[#00e5ff44] pl-4 py-2">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.1em] mb-2">¿QUÉ ES NON-CUSTODIAL?</div>
        <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">
          En PSY Wallet, vos siempre tenés control total de tus claves privadas.
          PSYCHOMETRIKS actúa como interfaz — como Rabby o MetaMask — sin nunca custodiar fondos.
          Esto nos exime de regulación financiera y garantiza que nadie más que vos controla tu dinero.
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Boveda() {
  const STORE = makeStore(getVaultUser());

  // ── Phase management ──────────────────────────────────────────────────────
  const [phase, setPhase]         = useState<VaultPhase>("locked");
  const [initialized, setInit]    = useState(false);

  // ── Keypad state ──────────────────────────────────────────────────────────
  const [digits, setDigits]       = useState("");
  const [confirmDigits, setConfirm] = useState("");
  const [firstPin, setFirstPin]   = useState("");
  const [processing, setProcessing] = useState(false);
  const [shake, setShake]         = useState(false);
  const [pinError, setPinError]   = useState("");

  // ── Unlocked vault data ───────────────────────────────────────────────────
  const [pin, setPin]             = useState("");
  const [seed, setSeed]           = useState("");
  const [privKey, setPrivKey]     = useState("");
  const [recovery, setRecovery]   = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [address, setAddress]     = useState("");
  const [tab, setTab]             = useState<VaultTab>("wallet");

  // ── Auto-lock timer ───────────────────────────────────────────────────────
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetAutoLock() {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      setPhase("locked");
      setPin(""); setSeed(""); setPrivKey(""); setRecovery("");
    }, 5 * 60 * 1000);
  }

  // ── Determine initial phase on mount ─────────────────────────────────────
  useEffect(() => {
    const hasPin = !!localStorage.getItem(STORE.PIN_HASH);
    const addr   = localStorage.getItem(STORE.ADDRESS) ?? "";
    if (addr) setAddress(addr);
    setPhase(hasPin ? "locked" : "welcome");
    setInit(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Trigger shake animation ───────────────────────────────────────────────
  function triggerShake(msg: string) {
    setShake(true);
    setPinError(msg);
    setTimeout(() => { setShake(false); setPinError(""); }, 600);
  }

  // ── Handle digit press (context-aware) ───────────────────────────────────
  async function handleDigit(d: string) {
    if (processing) return;

    if (phase === "locked") {
      const next = digits + d;
      setDigits(next);
      if (next.length < 6) return;

      // 6th digit reached: brief visual, then verify
      setProcessing(true);
      await new Promise(r => setTimeout(r, 280));

      const stored = localStorage.getItem(STORE.PIN_HASH);
      const hash   = await hashPin(next);

      if (hash !== stored) {
        triggerShake("PIN incorrecto. Inténtalo de nuevo.");
        setDigits("");
        setProcessing(false);
        return;
      }

      try {
        const [decSeed, decKey, decRec] = await Promise.all([
          decryptData(localStorage.getItem(STORE.SEED_ENC)     ?? "", next),
          decryptData(localStorage.getItem(STORE.KEY_ENC)      ?? "", next),
          decryptData(localStorage.getItem(STORE.RECOVERY_ENC) ?? "", next),
        ]);
        setPin(next);
        setSeed(decSeed);
        setPrivKey(decKey);
        setRecovery(decRec);
        setTotpSecret(localStorage.getItem(STORE.TOTP_SECRET) ?? "");
        setDigits("");
        setPhase("unlocked");
        resetAutoLock();
      } catch {
        triggerShake("Error al descifrar. PIN incorrecto.");
        setDigits("");
      }
      setProcessing(false);
      return;
    }

    if (phase === "create-pin") {
      const next = digits + d;
      setDigits(next);
      if (next.length < 6) return;

      // Advance to confirm after brief pause
      setProcessing(true);
      await new Promise(r => setTimeout(r, 280));
      setFirstPin(next);
      setDigits("");
      setConfirm("");
      setProcessing(false);
      setPhase("confirm-pin");
      return;
    }

    if (phase === "confirm-pin") {
      const next = confirmDigits + d;
      setConfirm(next);
      if (next.length < 6) return;

      setProcessing(true);
      await new Promise(r => setTimeout(r, 280));

      if (next !== firstPin) {
        triggerShake("Los PINs no coinciden. Vuelve a intentarlo.");
        setConfirm("");
        setDigits("");
        setProcessing(false);
        setPhase("create-pin");
        return;
      }

      // PINs match — generate vault
      const pinHash = await hashPin(next);
      const newSeed = generateSeedPhrase();
      const newKey  = generatePrivateKey();
      const newRec  = generateRecoveryKey();

      const [encSeed, encKey, encRec] = await Promise.all([
        encryptData(newSeed, next),
        encryptData(newKey,  next),
        encryptData(newRec,  next),
      ]);

      localStorage.setItem(STORE.PIN_HASH,     pinHash);
      localStorage.setItem(STORE.SEED_ENC,     encSeed);
      localStorage.setItem(STORE.KEY_ENC,      encKey);
      localStorage.setItem(STORE.RECOVERY_ENC, encRec);

      setPin(next);
      setSeed(newSeed);
      setPrivKey(newKey);
      setRecovery(newRec);
      setDigits("");
      setConfirm("");
      setProcessing(false);
      setPhase("seed-reveal");
      return;
    }
  }

  function handleDelete() {
    if (processing) return;
    if (phase === "confirm-pin") setConfirm(d => d.slice(0, -1));
    else setDigits(d => d.slice(0, -1));
  }

  function saveTotpSecret(s: string) {
    localStorage.setItem(STORE.TOTP_SECRET, s);
    setTotpSecret(s);
  }

  function saveAddress(a: string) {
    localStorage.setItem(STORE.ADDRESS, a);
    setAddress(a);
  }

  if (!initialized) return null;

  // ── PHASE: WELCOME (first time) ──────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <VaultHeader subtitle="BÓVEDA ULTRA SEGURA" />

          <div className="border border-[#1a2535] bg-[#060a0f] p-6 mb-6 text-left space-y-3">
            <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">
              PSY VAULT cifra toda tu información localmente con AES-256-GCM.
              Nunca subimos tus claves a ningún servidor.
            </div>
            <div className="space-y-2">
              {["🔐 PIN de 6 dígitos para acceder", "🌱 Frase semilla de 12 palabras", "🔑 Clave privada cifrada", "📱 Opcional: Google Authenticator 2FA"].map(item => (
                <div key={item} className="font-space text-[10px] text-[#7ab3c8]">{item}</div>
              ))}
            </div>
          </div>

          <div className="font-bebas text-2xl text-white mb-6">
            ¿DESEAS CREAR TU BÓVEDA?
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setPhase("create-pin"); setDigits(""); }}
              className="w-full py-4 border border-[#00e5ff] bg-[#00e5ff0a] text-[#00e5ff] font-bebas text-xl tracking-[0.2em] hover:bg-[#00e5ff18] transition-all">
              SÍ, CREAR MI BÓVEDA
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 border border-[#1a2535] text-[#5a8898] font-space text-[10px] tracking-[0.2em] hover:text-[#7ab3c8] transition-all">
              QUIZÁS DESPUÉS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: CREATE PIN ────────────────────────────────────────────────────
  if (phase === "create-pin") {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <VaultHeader subtitle="PASO 1 DE 3" />
          <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] text-center mb-4">
            CREA TU PIN DE 6 DÍGITOS
          </div>
          {pinError && (
            <div className="font-space text-[10px] text-[#ff1744] text-center mb-3">{pinError}</div>
          )}
          <PinKeypad digits={digits} onDigit={handleDigit} onDelete={handleDelete} processing={processing} shake={shake} />
          <div className="mt-6 border border-[#1a2535] bg-[#060a0f] p-3 text-center">
            <div className="font-space text-[9px] text-[#7ab3c8] leading-relaxed">
              Tu PIN cifra toda la información sensible.<br/>
              PSYCHOMETRIKS nunca ve tus claves.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: CONFIRM PIN ───────────────────────────────────────────────────
  if (phase === "confirm-pin") {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <VaultHeader subtitle="PASO 2 DE 3" />
          <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] text-center mb-4">
            REPITE TU PIN PARA CONFIRMAR
          </div>
          {pinError && (
            <div className="font-space text-[10px] text-[#ff1744] text-center mb-3">{pinError}</div>
          )}
          <PinKeypad digits={confirmDigits} onDigit={handleDigit} onDelete={handleDelete} processing={processing} shake={shake} />
        </div>
      </div>
    );
  }

  // ── PHASE: SEED REVEAL ───────────────────────────────────────────────────
  if (phase === "seed-reveal") {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <VaultHeader subtitle="PASO 3 DE 3 — MUY IMPORTANTE" />

          <div className="border border-[#ff174422] bg-[#ff174408] p-4 mb-4">
            <div className="font-bebas text-lg text-[#ff1744] mb-1">⚠️ GUARDA ESTAS PALABRAS AHORA</div>
            <div className="font-space text-[10px] text-[#8a9ab0] leading-relaxed">
              Estas 12 palabras son la única forma de recuperar tu bóveda.
              Escríbelas en papel físico. No las fotografíes ni las guardes en la nube.
            </div>
          </div>

          <div className="mb-4">
            <SeedReveal seed={seed} />
          </div>

          <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-4">
            <div className="font-space text-[9px] text-[#7ab3c8] leading-relaxed space-y-1">
              <div>✅ Escríbela en papel físico y guárdala en un lugar seguro</div>
              <div>✅ Haz dos copias y guárdalas en lugares distintos</div>
              <div>❌ Nunca la guardes en fotos, screenshots o cloud</div>
              <div>❌ Nunca la compartas con nadie, ni con soporte</div>
            </div>
          </div>

          <button
            onClick={() => { setPhase("unlocked"); resetAutoLock(); }}
            className="w-full py-4 border border-[#00e676] bg-[#00e67608] text-[#00e676] font-bebas text-xl tracking-[0.2em] hover:bg-[#00e67618] transition-all">
            ✅ YA LA GUARDÉ, ABRIR MI BÓVEDA
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: LOCKED ────────────────────────────────────────────────────────
  if (phase === "locked") {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <VaultHeader subtitle="BÓVEDA ULTRA SEGURA" />

          {/* localStorage warning */}
          <div className="border border-[#ffd70033] bg-[#ffd70008] px-4 py-3 mb-5 flex items-start gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <div className="font-space text-[9px] text-[#ffd700] font-bold tracking-[0.1em] mb-1">AVISO DE SEGURIDAD — NAVEGADOR</div>
              <div className="font-space text-[9px] text-[#8a8060] leading-relaxed">
                Tu bóveda se almacena cifrada en este navegador.
                Si limpias el caché o los datos del sitio, <span className="text-[#ffd700]">perderás el acceso permanentemente</span>.
                Descargá tu backup (pestaña BACKUP) y guardalo en un lugar seguro.
              </div>
            </div>
          </div>

          <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] text-center mb-4">
            INGRESA TU PIN
          </div>
          {pinError && (
            <div className="font-space text-[10px] text-[#ff1744] text-center mb-3 animate-pulse">{pinError}</div>
          )}
          <PinKeypad digits={digits} onDigit={handleDigit} onDelete={handleDelete} processing={processing} shake={shake} />
          <div className="mt-6 text-center space-y-3">
            <div className="font-space text-[9px] text-[#5a8898]">Protegida con AES-256-GCM · Todo cifrado localmente</div>
            <ResetVaultButton />
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: UNLOCKED ──────────────────────────────────────────────────────
  const TABS: { id: VaultTab; label: string; icon: string }[] = [
    { id: "wallet",   label: "WALLET",     icon: "🦊" },
    { id: "seed",     label: "SEMILLA",    icon: "🌱" },
    { id: "key",      label: "CLAVE",      icon: "🔑" },
    { id: "totp",     label: "GOOGLE 2FA", icon: "📱" },
    { id: "recovery", label: "RECOVERY",   icon: "🆘" },
    { id: "backup",   label: "BACKUP",     icon: "💾" },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <section className="pt-32 pb-8 px-6 md:px-12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-2 flex items-center gap-3">
              Bóveda Ultra Segura <div className="h-px bg-[#1a2535] flex-1 max-w-[60px]" />
            </div>
            <h1 className="font-bebas text-5xl md:text-7xl leading-none">
              PSY<span className="text-[#00e5ff]">VAULT</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-[#00e67644] bg-[#00e67608] px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              <span className="font-space text-[10px] text-[#00e676]">BÓVEDA ABIERTA</span>
            </div>
            <button
              onClick={() => {
                setPhase("locked");
                setPin(""); setSeed(""); setPrivKey(""); setRecovery("");
                setDigits("");
              }}
              className="border border-[#ff174444] bg-[#ff174408] text-[#ff1744] font-space text-[10px] tracking-[0.1em] px-3 py-1.5 hover:bg-[#ff174415] transition-all">
              🔒 BLOQUEAR
            </button>
          </div>
        </div>
        <p className="font-space text-[11px] text-[#7ab3c8] max-w-xl leading-relaxed">
          Toda la información está cifrada localmente con AES-256-GCM.
          PSYCHOMETRIKS nunca ve ni almacena tus claves privadas.
          Se bloquea automáticamente en 5 minutos.
        </p>
      </section>

      <section className="px-6 md:px-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1a2535] border border-[#1a2535]">
          {[
            { label: "CIFRADO",  value: "AES-256-GCM",   color: "#00e5ff" },
            { label: "ALMACÉN", value: "LOCAL ONLY",      color: "#00e676" },
            { label: "CUSTODIA",value: "NON-CUSTODIAL",   color: "#00e676" },
            { label: "SERVIDOR",value: "CERO CLAVES",     color: "#00e676" },
            { label: "AUTO-LOCK",value: "5 MINUTOS",      color: "#ffd700" },
          ].map(s => (
            <div key={s.label} className="bg-[#060a0f] px-4 py-3">
              <div className="font-space text-[8px] text-[#5a8898] tracking-[0.2em] mb-1">{s.label}</div>
              <div className="font-bebas text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-4">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 font-space text-[10px] tracking-[0.1em] border whitespace-nowrap transition-all"
              style={{
                borderColor: tab === t.id ? "#00e5ff" : "#1a2535",
                color:       tab === t.id ? "#00e5ff" : "#4a6070",
                background:  tab === t.id ? "#00e5ff08" : "transparent",
              }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        {tab === "wallet" && (
          <WalletTab address={address} onConnect={saveAddress} totpEnabled={!!totpSecret} />
        )}

        {tab === "seed" && (
          <div className="space-y-4 max-w-2xl">
            <div className="border border-[#ff174422] bg-[#ff174408] p-4">
              <div className="font-bebas text-xl text-[#ff1744] mb-1">⚠️ INFORMACIÓN ULTRA SENSIBLE</div>
              <div className="font-space text-[10px] text-[#8a9ab0] leading-relaxed">
                Estas 12 palabras son el acceso completo a tu bóveda. Con ellas se puede recuperar todo.
                NUNCA las ingreses en otro sitio. NUNCA las fotografíes. Escríbelas en papel físico.
              </div>
            </div>
            <MaskedField label="FRASE SEMILLA — 12 PALABRAS (BIP39)" value={seed} wordMode />
            <div className="border border-[#1a2535] bg-[#060a0f] p-4">
              <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-3">REGLAS DE ORO</div>
              <div className="space-y-2">
                {[
                  "✅ Escríbela en papel físico y guárdala en un lugar seguro",
                  "✅ Hazla dos copias y guárdalas en lugares distintos",
                  "❌ Nunca la guardes en fotos, screenshots o cloud",
                  "❌ Nunca la compartas con nadie, ni con soporte",
                  "❌ Nunca la ingreses en otro sitio web",
                ].map(r => (
                  <div key={r} className="font-space text-[10px] text-[#7ab3c8]">{r}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "key" && (
          <div className="space-y-4 max-w-2xl">
            <div className="border border-[#ff174422] bg-[#ff174408] p-4">
              <div className="font-bebas text-xl text-[#ff1744] mb-1">🔑 CLAVE PRIVADA</div>
              <div className="font-space text-[10px] text-[#8a9ab0] leading-relaxed">
                Esta es tu clave privada de wallet. Quien la tenga controla tus fondos completamente.
                NUNCA la compartas. NUNCA la ingreses en sitios desconocidos.
              </div>
            </div>
            <MaskedField label="CLAVE PRIVADA (HEX 256-bit)" value={privKey} />
            <div className="border border-[#1a2535] bg-[#060a0f] p-4">
              <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em] mb-2">DIRECCIÓN DERIVADA</div>
              <div className="font-sharetech text-[12px] text-[#8a9ab0]">{privateKeyToAddress(privKey)}</div>
              <div className="font-space text-[9px] text-[#5a8898] mt-1">Derivada de tu clave privada · Red: Ethereum (EVM compatible)</div>
            </div>
          </div>
        )}

        {tab === "totp" && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <div className="font-bebas text-3xl text-white mb-2">GOOGLE <span className="text-[#00e5ff]">AUTHENTICATOR</span></div>
              <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">
                Agrega una capa extra de seguridad. Al activar 2FA, necesitarás el código de 6 dígitos
                de Google Authenticator además de tu PIN para acceder a información crítica.
              </div>
            </div>
            <TotpSection storedSecret={totpSecret} onSave={saveTotpSecret} />
          </div>
        )}

        {tab === "recovery" && (
          <div className="max-w-2xl">
            <RecoverySection recoveryKey={recovery} />
          </div>
        )}

        {tab === "backup" && (
          <BackupTab store={STORE} pin={pin} />
        )}
      </section>
    </div>
  );
}

// ─── Backup Tab ───────────────────────────────────────────────────────────────
function BackupTab({ store, pin }: { store: ReturnType<typeof makeStore>; pin: string }) {
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function doExport() {
    setExporting(true);
    setExportDone(false);
    try {
      await exportVault(store as unknown as Record<string, string>, pin);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } finally {
      setExporting(false);
    }
  }

  async function doImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    const result = await importVault(importFile, pin, store as unknown as Record<string, string>);
    setImportResult(result);
    setImporting(false);
    if (result.ok) {
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Warning banner */}
      <div className="border border-[#ffd70033] bg-[#ffd70008] p-5 flex items-start gap-4">
        <span className="text-2xl shrink-0">⚠️</span>
        <div>
          <div className="font-bebas text-xl text-[#ffd700] mb-1">RIESGO DE PÉRDIDA DE DATOS</div>
          <div className="font-space text-[10px] text-[#8a8060] leading-relaxed">
            Tu bóveda existe <span className="text-[#ffd700] font-bold">sólo en este navegador</span>.
            Si limpiás el caché, usás otro dispositivo o reinstalás el navegador,{" "}
            <span className="text-[#ffd700] font-bold">perderás todo el acceso permanentemente</span>.
            Descargá tu backup periódicamente y guardalo en un lugar offline seguro.
          </div>
        </div>
      </div>

      {/* Export section */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-6">
        <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.3em] mb-3">💾 EXPORTAR BACKUP CIFRADO</div>
        <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-4">
          Descarga un archivo <code className="text-[#00e5ff] font-mono">.psyv</code> con toda tu bóveda encriptada con tu PIN.
          Sin el PIN, el archivo es inutilizable. Guardalo en un disco externo o USB offline.
        </div>
        <div className="space-y-2 mb-5 font-space text-[10px] text-[#7ab3c8]">
          <div>✅ El archivo contiene: PIN hash, seed cifrada, clave privada cifrada, recovery key cifrada, TOTP</div>
          <div>✅ Todo permanece cifrado con AES-256-GCM — ni PSYCHOMETRIKS puede leerlo</div>
          <div>❌ No lo guardes en la nube (Google Drive, Dropbox, iCloud)</div>
        </div>
        <button onClick={doExport} disabled={exporting}
          className="flex items-center gap-3 px-6 py-3 border border-[#00e5ff44] bg-[#00e5ff08] text-[#00e5ff] font-space text-[11px] font-bold tracking-[0.15em] hover:bg-[#00e5ff15] transition-all disabled:opacity-60">
          {exporting ? "⏳ GENERANDO..." : exportDone ? "✅ BACKUP DESCARGADO" : "💾 DESCARGAR BACKUP (.psyv)"}
        </button>
        {exportDone && (
          <div className="mt-2 font-space text-[9px] text-[#00e676]">
            Archivo descargado. Guardalo en un lugar offline seguro (USB, disco externo).
          </div>
        )}
      </div>

      {/* Import section */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-6">
        <div className="font-space text-[9px] text-[#e040fb] tracking-[0.3em] mb-3">📂 IMPORTAR BACKUP</div>
        <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-4">
          Restaurá tu bóveda desde un archivo <code className="text-[#e040fb] font-mono">.psyv</code> previo.
          Usará tu PIN actual para descifrar el archivo. Los datos se sobrescribirán con los del backup.
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => fileRef.current?.click()}
            className="px-4 py-2 border border-[#1a2535] text-[#7ab3c8] font-space text-[10px] tracking-[0.1em] hover:border-[#e040fb44] hover:text-[#e040fb] transition-all">
            SELECCIONAR ARCHIVO
          </button>
          {importFile && (
            <span className="font-space text-[10px] text-[#8a9ab0]">{importFile.name}</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".psyv"
            className="hidden"
            onChange={e => {
              setImportFile(e.target.files?.[0] ?? null);
              setImportResult(null);
            }}
          />
        </div>

        {importFile && (
          <button onClick={doImport} disabled={importing}
            className="flex items-center gap-3 px-6 py-3 border border-[#e040fb44] bg-[#e040fb08] text-[#e040fb] font-space text-[11px] font-bold tracking-[0.15em] hover:bg-[#e040fb15] transition-all disabled:opacity-60">
            {importing ? "⏳ RESTAURANDO..." : "📂 RESTAURAR BÓVEDA DESDE BACKUP"}
          </button>
        )}

        {importResult && (
          <div className={`mt-3 border px-4 py-3 font-space text-[10px] ${importResult.ok ? "border-[#00e67644] bg-[#00e67608] text-[#00e676]" : "border-[#ff174433] bg-[#ff174408] text-[#ff1744]"}`}>
            {importResult.ok
              ? "✅ Bóveda restaurada correctamente. Recargando..."
              : `✗ ${importResult.error}`}
          </div>
        )}

        <div className="mt-4 border border-[#ff174422] bg-[#ff174408] px-4 py-3">
          <div className="font-space text-[9px] text-[#ff1744] leading-relaxed">
            ⚠️ La importación sobreescribe tu bóveda actual. Asegurate de tener un backup reciente antes de continuar.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Seed Reveal (usado en setup) ─────────────────────────────────────────────
function SeedReveal({ seed }: { seed: string }) {
  const [revealed, setRevealed] = useState(false);
  const words = seed.split(" ");

  return (
    <div className="border border-[#1a2535] bg-[#060a0f] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.2em]">FRASE SEMILLA — 12 PALABRAS</div>
        <button
          onClick={() => setRevealed(r => !r)}
          className="font-space text-[9px] px-3 py-1 border transition-colors"
          style={{ borderColor: revealed ? "#ff174444" : "#00e5ff44", color: revealed ? "#ff1744" : "#00e5ff" }}>
          {revealed ? "OCULTAR" : "MOSTRAR"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {words.map((w, i) => (
          <div key={i} className="flex items-center gap-2 border border-[#1a2535] px-2 py-1.5">
            <span className="font-space text-[8px] text-[#5a8898] w-4">{i+1}</span>
            <span
              className="font-sharetech text-[11px] transition-all"
              style={revealed
                ? { color: "#00e5ff" }
                : { color: "transparent", textShadow: "0 0 8px #00e5ff80", filter: "blur(4px)", userSelect: "none" }}>
              {revealed ? w : "•••••"}
            </span>
          </div>
        ))}
      </div>
      {!revealed && (
        <div className="mt-3 text-center font-space text-[9px] text-[#5a8898]">
          Haz clic en MOSTRAR para ver tus palabras semilla
        </div>
      )}
    </div>
  );
}

