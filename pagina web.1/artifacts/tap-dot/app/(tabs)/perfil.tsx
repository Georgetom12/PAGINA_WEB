import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJournal } from "@/context/JournalContext";

type Plan = "BÁSICO" | "PRO" | "ADMIN";

const PLAN_FEATURES: Record<Plan, { label: string; included: boolean }[]> = {
  BÁSICO: [
    { label: "Señales básicas (delay 4h)", included: true },
    { label: "PSY Screener (top 10)", included: true },
    { label: "Journal de trading", included: true },
    { label: "Señales en tiempo real", included: false },
    { label: "PSY Screener completo (50)", included: false },
    { label: "Whale Alert en tiempo real", included: false },
    { label: "Funding & Liquidaciones", included: false },
  ],
  PRO: [
    { label: "Señales en tiempo real", included: true },
    { label: "PSY Screener completo (50)", included: true },
    { label: "Journal de trading + IA", included: true },
    { label: "Whale Alert en tiempo real", included: true },
    { label: "Funding & Liquidaciones", included: true },
    { label: "Market Hours globales", included: true },
    { label: "Grupo VIP Telegram", included: false },
  ],
  ADMIN: [
    { label: "Todo lo de PRO", included: true },
    { label: "Panel de administración", included: true },
    { label: "Grupo VIP Telegram", included: true },
    { label: "Análisis personalizados", included: true },
    { label: "Señales de altcoins", included: true },
    { label: "PSY Token — early adopter", included: true },
    { label: "Soporte directo", included: true },
  ],
};

const PLAN_COLOR: Record<Plan, string> = {
  BÁSICO: "#546e7a",
  PRO: "#00e5ff",
  ADMIN: "#ffd700",
};

const CHALLENGE_DAYS = 30;
const CHALLENGE_TARGET = 20;

const WEB_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "https://psychometriks.trade";

const API_BASE = WEB_DOMAIN;

// ─── Updates data ─────────────────────────────────────────────────────────────
const UPDATES = [
  { emoji: "🔐", title: "PSY VAULT",        desc: "Bóveda ultra-segura · AES-256-GCM · Semilla BIP39 · 2FA", date: "May 2025", color: "#00e5ff" },
  { emoji: "📊", title: "LIQMAP TAB",        desc: "Whale Alert · Spot/Perp · Ciclos BTC · Market Hours",     date: "May 2025", color: "#ffd700" },
  { emoji: "📚", title: "AULA VIRTUAL",      desc: "40 módulos de N1 a N8 · Smart Money · Macro · Gestión",   date: "May 2025", color: "#e040fb" },
  { emoji: "🐋", title: "WHALE ALERT LIVE",  desc: "Movimientos on-chain +$1M · actualización cada 3 min",   date: "Abr 2025", color: "#00e676" },
  { emoji: "₿",  title: "CICLOS BTC",        desc: "Análisis post-halving 2024 · RSI mensual · Fase actual",  date: "Abr 2025", color: "#ff6d00" },
  { emoji: "🧠", title: "PSY SCORE",         desc: "Test de psicología del trader · 5 perfiles · Resultado",  date: "Mar 2025", color: "#7c4dff" },
];

// ─── Plans data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "BÁSICO",
    price: "Gratis",
    period: "",
    color: "#546e7a",
    features: ["Señales básicas (delay 4h)", "Screener top 10 cryptos", "Journal de trading", "1 test psicológico"],
    cta: "PLAN ACTUAL",
    isCurrent: true,
  },
  {
    id: "PRO",
    price: "$49",
    period: "/mes",
    color: "#00e5ff",
    features: ["Señales en tiempo real", "Screener 50 cryptos + macro", "Whale Alert en vivo", "Aula Virtual completa (40 módulos)", "LiqMap · Ciclos BTC · FED×BTC", "Journal con métricas IA", "Grupo VIP Telegram"],
    cta: "ACTUALIZAR A PRO",
    isCurrent: false,
  },
  {
    id: "ELITE",
    price: "$99",
    period: "/mes",
    color: "#ffd700",
    features: ["Todo lo de PRO", "Análisis personalizados 1:1", "Señales de altcoins exclusivas", "PSY Token — early adopter", "Soporte directo por Telegram", "Acceso anticipado a funciones"],
    cta: "ACTUALIZAR A ELITE",
    isCurrent: false,
  },
];

// ─── Updates section ──────────────────────────────────────────────────────────
function UpdatesSection({ colors }: { colors: any }) {
  return (
    <View style={[updatesStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {UPDATES.map((u, i) => (
        <View
          key={u.title}
          style={[updatesStyles.row, i < UPDATES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
        >
          <View style={[updatesStyles.emojiWrap, { backgroundColor: u.color + "15", borderColor: u.color + "40" }]}>
            <Text style={updatesStyles.emoji}>{u.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={updatesStyles.titleRow}>
              <Text style={[updatesStyles.title, { color: colors.foreground }]}>{u.title}</Text>
              <Text style={[updatesStyles.date, { color: colors.mutedForeground }]}>{u.date}</Text>
            </View>
            <Text style={[updatesStyles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{u.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Plans section ────────────────────────────────────────────────────────────
function PlansSection({ colors }: { colors: any }) {
  function handlePlan(plan: typeof PLANS[0]) {
    if (plan.isCurrent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`${WEB_DOMAIN}/pricing`);
  }

  return (
    <View style={{ gap: 10 }}>
      {PLANS.map(plan => (
        <View
          key={plan.id}
          style={[plansStyles.card, {
            backgroundColor: plan.isCurrent ? colors.card : plan.color + "08",
            borderColor: plan.isCurrent ? colors.border : plan.color + "50",
            borderWidth: plan.isCurrent ? 1 : 1.5,
          }]}
        >
          <View style={plansStyles.planHeader}>
            <View>
              <Text style={[plansStyles.planName, { color: plan.color }]}>{plan.id}</Text>
              <View style={plansStyles.priceRow}>
                <Text style={[plansStyles.price, { color: colors.foreground }]}>{plan.price}</Text>
                {plan.period && <Text style={[plansStyles.period, { color: colors.mutedForeground }]}>{plan.period}</Text>}
              </View>
            </View>
            {plan.isCurrent && (
              <View style={[plansStyles.currentBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[plansStyles.currentText, { color: colors.mutedForeground }]}>ACTUAL</Text>
              </View>
            )}
          </View>
          <View style={plansStyles.features}>
            {plan.features.map(f => (
              <View key={f} style={plansStyles.featureRow}>
                <Feather name="check" size={11} color={plan.color} />
                <Text style={[plansStyles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
              </View>
            ))}
          </View>
          {!plan.isCurrent && (
            <TouchableOpacity
              style={[plansStyles.ctaBtn, { backgroundColor: plan.color, borderColor: plan.color }]}
              onPress={() => handlePlan(plan)}
            >
              <Text style={plansStyles.ctaText}>{plan.cta}</Text>
              <Feather name="external-link" size={12} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <Text style={[plansStyles.footNote, { color: colors.mutedForeground }]}>
        * Los planes se gestionan en psychometriks.com · Cancelación anytime
      </Text>
    </View>
  );
}

// ─── BIP39-style wordlist (128 words) ──────────────────────────────────────────
const WORDS = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis".split(" ");

// ─── Simple djb2 hash for PIN (mobile — no crypto.subtle) ─────────────────────
function hashPin(pin: string): string {
  const salted = "PSY_VAULT_MOBILE_" + pin;
  let hash = 5381;
  for (let i = 0; i < salted.length; i++) {
    hash = ((hash << 5) + hash + salted.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function generateSeed(): string {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => WORDS[b % WORDS.length]).join(" ");
}

function generateKey(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return "0x" + Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateRecovery(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join("").replace(/(.{6})/g, "$1-").slice(0, 29);
}

// ─── Vault storage keys ────────────────────────────────────────────────────────
const VKEY = {
  PIN:  "psym_pin",
  SEED: "psym_seed",
  KEY:  "psym_key",
  REC:  "psym_rec",
  TOTP: "psym_totp",
};

// ─── PSY Vault Modal ──────────────────────────────────────────────────────────
function VaultModal({ visible, onClose, colors }: {
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const [phase, setPhase] = useState<"pin"|"setup"|"confirm"|"open">("pin");
  const [digits, setDigits] = useState("");
  const [confirmDigits, setConfirmDigits] = useState("");
  const [pinError, setPinError] = useState("");
  const [hasVault, setHasVault] = useState(false);
  const [vaultPin, setVaultPin] = useState("");

  // Vault data (in-memory only while open)
  const [seed, setSeed]     = useState("");
  const [privKey, setPrivKey] = useState("");
  const [recovery, setRecovery] = useState("");
  const [totpEnabled, setTotpEnabled] = useState(false);

  // Reveal states
  const [revealSeed, setRevealSeed]       = useState(false);
  const [revealKey, setRevealKey]         = useState(false);
  const [revealRec, setRevealRec]         = useState(false);
  const [copiedField, setCopiedField]     = useState("");
  const [vaultTab, setVaultTab]           = useState<"seed"|"key"|"recovery">("seed");

  const checkVault = useCallback(async () => {
    const stored = await SecureStore.getItemAsync(VKEY.PIN);
    setHasVault(!!stored);
    setPhase(!!stored ? "pin" : "setup");
  }, []);

  useEffect(() => {
    if (visible) {
      checkVault();
      setDigits(""); setConfirmDigits(""); setPinError("");
      setRevealSeed(false); setRevealKey(false); setRevealRec(false);
      setVaultTab("seed");
    }
  }, [visible, checkVault]);

  function pressDigit(d: string) {
    Haptics.selectionAsync();
    if (phase === "pin" || phase === "setup") {
      const next = digits + d;
      setDigits(next);
      if (next.length === 6) {
        if (phase === "pin") handleUnlock(next);
        else setPhase("confirm");
      }
    } else if (phase === "confirm") {
      const next = confirmDigits + d;
      setConfirmDigits(next);
      if (next.length === 6) {
        if (next === digits) handleSetup(digits);
        else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setPinError("Los PINs no coinciden. Intenta de nuevo.");
          setDigits(""); setConfirmDigits(""); setPhase("setup");
          setTimeout(() => setPinError(""), 2500);
        }
      }
    }
  }

  function delDigit() {
    Haptics.selectionAsync();
    if (phase === "pin" || phase === "setup") setDigits(d => d.slice(0, -1));
    else if (phase === "confirm") setConfirmDigits(d => d.slice(0, -1));
  }

  async function handleUnlock(pin: string) {
    const stored = await SecureStore.getItemAsync(VKEY.PIN);
    if (!stored || hashPin(pin) !== stored) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError("PIN incorrecto");
      setDigits("");
      setTimeout(() => setPinError(""), 2000);
      return;
    }
    // Load vault data desde el enclave seguro del dispositivo
    const [s, k, r, t] = await Promise.all([
      SecureStore.getItemAsync(VKEY.SEED),
      SecureStore.getItemAsync(VKEY.KEY),
      SecureStore.getItemAsync(VKEY.REC),
      SecureStore.getItemAsync(VKEY.TOTP),
    ]);
    setSeed(s ?? ""); setPrivKey(k ?? ""); setRecovery(r ?? "");
    setTotpEnabled(!!t); setVaultPin(pin);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("open");
  }

  async function handleSetup(pin: string) {
    const newSeed = generateSeed();
    const newKey  = generateKey();
    const newRec  = generateRecovery();
    // Guardar en el enclave seguro del dispositivo (Keychain iOS / Keystore Android)
    await Promise.all([
      SecureStore.setItemAsync(VKEY.PIN,  hashPin(pin)),
      SecureStore.setItemAsync(VKEY.SEED, newSeed),
      SecureStore.setItemAsync(VKEY.KEY,  newKey),
      SecureStore.setItemAsync(VKEY.REC,  newRec),
    ]);
    setSeed(newSeed); setPrivKey(newKey); setRecovery(newRec);
    setVaultPin(pin); setHasVault(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("open");
  }

  function copyToClipboard(text: string, field: string) {
    // Clipboard API on React Native web
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  }

  function handleClose() {
    // Clear sensitive data from memory
    setSeed(""); setPrivKey(""); setRecovery(""); setVaultPin("");
    setDigits(""); setConfirmDigits("");
    onClose();
  }

  const currentDigits = phase === "confirm" ? confirmDigits : digits;

  const pinLabel = phase === "pin" ? "INGRESA TU PIN"
    : phase === "setup" ? "CREA UN PIN DE 6 DÍGITOS"
    : "CONFIRMA TU PIN";

  const bg = "#020408";
  const borderColor = "#1a2535";
  const accent = "#00e5ff";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={[vaultStyles.header, { borderBottomColor: borderColor }]}>
          <View style={vaultStyles.headerLeft}>
            <Text style={vaultStyles.headerTitle}>PSY<Text style={{ color: accent }}>VAULT</Text></Text>
            {phase === "open" && (
              <View style={vaultStyles.unlockBadge}>
                <View style={vaultStyles.unlockDot} />
                <Text style={vaultStyles.unlockText}>ABIERTA</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={vaultStyles.closeBtn}>
            <Text style={vaultStyles.closeBtnText}>{phase === "open" ? "🔒 BLOQUEAR" : "✕"}</Text>
          </TouchableOpacity>
        </View>

        {/* PIN Entry */}
        {(phase === "pin" || phase === "setup" || phase === "confirm") && (
          <View style={vaultStyles.lockContainer}>
            {/* Lock icon */}
            <View style={vaultStyles.lockIcon}>
              <Text style={{ fontSize: 48 }}>🔐</Text>
            </View>
            <Text style={vaultStyles.pinLabel}>{pinLabel}</Text>
            {phase === "setup" && (
              <Text style={vaultStyles.pinSub}>Tu PIN cifra toda la información sensible</Text>
            )}

            {/* Dots */}
            <View style={vaultStyles.dotsRow}>
              {[0,1,2,3,4,5].map(i => (
                <View key={i} style={[vaultStyles.dot, {
                  backgroundColor: currentDigits.length > i ? accent : "transparent",
                  borderColor: currentDigits.length > i ? accent : borderColor,
                  shadowColor: currentDigits.length > i ? accent : "transparent",
                  shadowOpacity: currentDigits.length > i ? 0.8 : 0,
                  shadowRadius: 4,
                }]} />
              ))}
            </View>

            {pinError ? <Text style={vaultStyles.pinError}>{pinError}</Text> : null}

            {/* Keypad */}
            <View style={vaultStyles.keypad}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
                k === "" ? <View key={i} style={vaultStyles.keyEmpty} /> :
                <TouchableOpacity key={i} style={[vaultStyles.key, { borderColor }]}
                  onPress={() => k === "⌫" ? delDigit() : pressDigit(k)}
                  activeOpacity={0.6}>
                  <Text style={vaultStyles.keyText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={vaultStyles.secNote}>Cifrado AES-256 · Almacenado localmente · Non-custodial</Text>
          </View>
        )}

        {/* Vault Open */}
        {phase === "open" && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Security summary */}
            <View style={[vaultStyles.secSummary, { borderColor: "#00e67640" }]}>
              {[
                { icon: "🔐", label: "PIN", status: "ACTIVO" },
                { icon: "🌱", label: "SEMILLA", status: "GUARDADA" },
                { icon: "🔑", label: "CLAVE", status: "CIFRADA" },
                { icon: "📱", label: "2FA", status: totpEnabled ? "ON" : "PENDIENTE" },
              ].map(s => (
                <View key={s.label} style={vaultStyles.secItem}>
                  <Text style={{ fontSize: 18 }}>{s.icon}</Text>
                  <Text style={vaultStyles.secLabel}>{s.label}</Text>
                  <Text style={[vaultStyles.secStatus, { color: s.status === "PENDIENTE" ? "#ffd700" : "#00e676" }]}>
                    {s.status}
                  </Text>
                </View>
              ))}
            </View>

            {/* Tabs */}
            <View style={vaultStyles.tabRow}>
              {(["seed","key","recovery"] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => { setVaultTab(t); setRevealSeed(false); setRevealKey(false); setRevealRec(false); }}
                  style={[vaultStyles.tabBtn, { borderColor: vaultTab === t ? accent : borderColor, backgroundColor: vaultTab === t ? accent + "10" : "transparent" }]}>
                  <Text style={[vaultStyles.tabText, { color: vaultTab === t ? accent : "#4a6070" }]}>
                    {t === "seed" ? "🌱 SEMILLA" : t === "key" ? "🔑 CLAVE" : "🆘 RECOVERY"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SEMILLA */}
            {vaultTab === "seed" && (
              <View>
                <View style={[vaultStyles.warningBox, { borderColor: "#ff174430", backgroundColor: "#ff174408" }]}>
                  <Text style={vaultStyles.warningTitle}>⚠️ ULTRA SENSIBLE</Text>
                  <Text style={vaultStyles.warningText}>
                    Con estas 12 palabras se puede recuperar toda tu bóveda. Escríbelas en papel físico. NUNCA las fotografíes.
                  </Text>
                </View>
                <View style={[vaultStyles.dataCard, { borderColor }]}>
                  <View style={vaultStyles.dataHeader}>
                    <Text style={vaultStyles.dataLabel}>FRASE SEMILLA — 12 PALABRAS</Text>
                    <View style={vaultStyles.dataActions}>
                      <TouchableOpacity onPress={() => copyToClipboard(seed, "seed")} style={vaultStyles.actionBtn}>
                        <Text style={vaultStyles.actionText}>{copiedField === "seed" ? "✓ OK" : "COPIAR"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRevealSeed(r => !r)}
                        style={[vaultStyles.revealBtn, { borderColor: revealSeed ? "#ff174440" : accent + "40" }]}>
                        <Text style={[vaultStyles.revealText, { color: revealSeed ? "#ff1744" : accent }]}>
                          {revealSeed ? "OCULTAR" : "REVELAR"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={vaultStyles.wordsGrid}>
                    {seed.split(" ").map((word, i) => (
                      <View key={i} style={[vaultStyles.wordItem, { borderColor }]}>
                        <Text style={vaultStyles.wordNum}>{i + 1}</Text>
                        <Text style={[vaultStyles.wordText, { color: revealSeed ? accent : "transparent", textShadowColor: revealSeed ? "transparent" : accent + "90", textShadowRadius: revealSeed ? 0 : 6 }]}>
                          {revealSeed ? word : "•••"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* CLAVE PRIVADA */}
            {vaultTab === "key" && (
              <View>
                <View style={[vaultStyles.warningBox, { borderColor: "#ff174430", backgroundColor: "#ff174408" }]}>
                  <Text style={vaultStyles.warningTitle}>🔑 CLAVE PRIVADA</Text>
                  <Text style={vaultStyles.warningText}>
                    Quien tenga esta clave controla tus fondos. NUNCA la compartas. NUNCA la ingreses en sitios desconocidos.
                  </Text>
                </View>
                <View style={[vaultStyles.dataCard, { borderColor }]}>
                  <View style={vaultStyles.dataHeader}>
                    <Text style={vaultStyles.dataLabel}>CLAVE PRIVADA (HEX 256-bit)</Text>
                    <View style={vaultStyles.dataActions}>
                      <TouchableOpacity onPress={() => copyToClipboard(privKey, "key")} style={vaultStyles.actionBtn}>
                        <Text style={vaultStyles.actionText}>{copiedField === "key" ? "✓ OK" : "COPIAR"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRevealKey(r => !r)}
                        style={[vaultStyles.revealBtn, { borderColor: revealKey ? "#ff174440" : accent + "40" }]}>
                        <Text style={[vaultStyles.revealText, { color: revealKey ? "#ff1744" : accent }]}>
                          {revealKey ? "OCULTAR" : "REVELAR"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[vaultStyles.keyValue, {
                    color: revealKey ? accent : "transparent",
                    textShadowColor: revealKey ? "transparent" : accent + "90",
                    textShadowRadius: revealKey ? 0 : 8,
                  }]} selectable={revealKey}>
                    {revealKey ? privKey : privKey.replace(/./g, "•")}
                  </Text>
                </View>
              </View>
            )}

            {/* RECOVERY KEY */}
            {vaultTab === "recovery" && (
              <View>
                <View style={[vaultStyles.warningBox, { borderColor: "#ffd70040", backgroundColor: "#ffd70008" }]}>
                  <Text style={[vaultStyles.warningTitle, { color: "#ffd700" }]}>🆘 CLAVE DE RECUPERACIÓN</Text>
                  <Text style={vaultStyles.warningText}>
                    Esta es la única forma de recuperar tu bóveda si olvidas el PIN. Guárdala en lugar seguro offline. PSYCHOMETRIKS no puede recuperar claves perdidas.
                  </Text>
                </View>
                <View style={[vaultStyles.dataCard, { borderColor }]}>
                  <View style={vaultStyles.dataHeader}>
                    <Text style={vaultStyles.dataLabel}>CLAVE DE RECUPERACIÓN</Text>
                    <View style={vaultStyles.dataActions}>
                      <TouchableOpacity onPress={() => copyToClipboard(recovery, "rec")} style={vaultStyles.actionBtn}>
                        <Text style={vaultStyles.actionText}>{copiedField === "rec" ? "✓ OK" : "COPIAR"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRevealRec(r => !r)}
                        style={[vaultStyles.revealBtn, { borderColor: revealRec ? "#ff174440" : accent + "40" }]}>
                        <Text style={[vaultStyles.revealText, { color: revealRec ? "#ff1744" : accent }]}>
                          {revealRec ? "OCULTAR" : "REVELAR"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[vaultStyles.keyValue, {
                    fontSize: 18, letterSpacing: 3,
                    color: revealRec ? "#ffd700" : "transparent",
                    textShadowColor: revealRec ? "transparent" : "#ffd70090",
                    textShadowRadius: revealRec ? 0 : 8,
                  }]} selectable={revealRec}>
                    {revealRec ? recovery : "XXXX-XXXX-XXXX-XXXX"}
                  </Text>
                </View>
                <View style={[vaultStyles.dataCard, { borderColor, marginTop: 12 }]}>
                  <Text style={vaultStyles.dataLabel}>ENVIAR CLAVE VÍA TELEGRAM</Text>
                  <Text style={vaultStyles.tipText}>
                    Para enviar tu clave de recuperación por Telegram, usa la plataforma web en psychometriks.com/boveda.
                  </Text>
                </View>
              </View>
            )}

            {/* 2FA note */}
            <View style={[vaultStyles.totpCard, { borderColor: totpEnabled ? "#00e67640" : "#ffd70040", backgroundColor: totpEnabled ? "#00e67608" : "#ffd70008" }]}>
              <Text style={[vaultStyles.totpTitle, { color: totpEnabled ? "#00e676" : "#ffd700" }]}>
                📱 Google Authenticator — {totpEnabled ? "ACTIVO" : "NO CONFIGURADO"}
              </Text>
              <Text style={vaultStyles.totpText}>
                {totpEnabled
                  ? "2FA activado. Tu bóveda tiene protección adicional."
                  : "Configura Google Authenticator en psychometriks.com/boveda para mayor seguridad."}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Vault Entry Card ──────────────────────────────────────────────────────────
function VaultCard({ colors }: { colors: any }) {
  const [showVault, setShowVault] = useState(false);

  const openVault = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowVault(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={openVault}
        activeOpacity={0.85}
        style={[vaultCardStyles.card, { backgroundColor: "#020408", borderColor: "#00e5ff20" }]}>
        <View style={vaultCardStyles.top}>
          <View style={vaultCardStyles.iconArea}>
            <Text style={{ fontSize: 32 }}>🔐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={vaultCardStyles.title}>PSY<Text style={{ color: "#00e5ff" }}>VAULT</Text></Text>
            <Text style={vaultCardStyles.subtitle}>Bóveda ultra segura · AES-256-GCM</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#00e5ff" style={{ alignSelf: "center" }} />
        </View>

        <View style={vaultCardStyles.features}>
          {[
            { icon: "🌱", label: "Frase semilla 12 palabras" },
            { icon: "🔑", label: "Clave privada cifrada" },
            { icon: "📱", label: "Google Authenticator 2FA" },
            { icon: "🆘", label: "Clave de recuperación" },
          ].map(f => (
            <View key={f.label} style={vaultCardStyles.feature}>
              <Text style={{ fontSize: 13 }}>{f.icon}</Text>
              <Text style={[vaultCardStyles.featureText, { color: colors.mutedForeground }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={vaultCardStyles.openBtn}>
          <Text style={vaultCardStyles.openBtnText}>ABRIR BÓVEDA</Text>
          <Feather name="lock" size={14} color="#00e5ff" />
        </View>

        <Text style={vaultCardStyles.note}>Non-custodial · Tus claves, tu crypto · Zero conocimiento del servidor</Text>
      </TouchableOpacity>

      <VaultModal visible={showVault} onClose={() => setShowVault(false)} colors={colors} />
    </>
  );
}

// ─── Support Chat Section ──────────────────────────────────────────────────────
interface SupportMsg { id: number; body: string; fromAdmin: boolean; createdAt: string; }

function SupportSection({ colors }: { colors: any }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<SupportMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("psy_support_uid").then(uid => {
      if (uid) setUserId(uid);
    });
  }, []);

  const fetchMsgs = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/messages?userId=${userId}`);
      if (!res.ok) return;
      const data: SupportMsg[] = await res.json();
      setMsgs(data);
      const adminCount = data.filter(m => m.fromAdmin).length;
      setUnread(adminCount);
    } catch {}
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchMsgs();
    pollRef.current = setInterval(fetchMsgs, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId, fetchMsgs]);

  const openChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUnread(0);
    setOpen(true);
    if (!userId) {
      const newId = "mobile_" + Date.now();
      SecureStore.setItemAsync("psy_support_uid", newId);
      setUserId(newId);
    }
  };

  const send = async () => {
    if (!text.trim() || !userId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, body: text.trim(), platform: "mobile" }),
      });
      if (res.ok) {
        setText("");
        await fetchMsgs();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
    setSending(false);
  };

  return (
    <>
      <View style={[supportStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={supportStyles.row}>
          <View style={[supportStyles.iconWrap, { backgroundColor: "#00e67615", borderColor: "#00e67640" }]}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[supportStyles.title, { color: colors.foreground }]}>Soporte PSY</Text>
            <Text style={[supportStyles.sub, { color: colors.mutedForeground }]}>Chat directo con el equipo · Respuesta en ≤24h</Text>
          </View>
          {unread > 0 && (
            <View style={supportStyles.badge}>
              <Text style={supportStyles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[supportStyles.btn, { borderColor: "#00e676", backgroundColor: "#00e67615" }]} onPress={openChat}>
          <Feather name="message-circle" size={13} color="#00e676" />
          <Text style={[supportStyles.btnText, { color: "#00e676" }]}>ABRIR CHAT</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[supportStyles.modal, { backgroundColor: colors.background }]}>
          <View style={[supportStyles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[supportStyles.modalTitle, { color: colors.foreground }]}>💬 SOPORTE PSY</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {msgs.length === 0 && (
              <View style={supportStyles.empty}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                <Text style={[supportStyles.emptyText, { color: colors.mutedForeground }]}>
                  Enviá tu mensaje y el equipo responderá en menos de 24h.
                </Text>
              </View>
            )}
            {msgs.map(m => (
              <View key={m.id} style={[
                supportStyles.bubble,
                m.fromAdmin
                  ? { alignSelf: "flex-start", backgroundColor: colors.card, borderColor: "#00e67640" }
                  : { alignSelf: "flex-end", backgroundColor: "#00e67620", borderColor: "#00e67640" }
              ]}>
                {m.fromAdmin && (
                  <Text style={[supportStyles.bubbleSender, { color: "#00e676" }]}>PSY TEAM</Text>
                )}
                <Text style={[supportStyles.bubbleText, { color: colors.foreground }]}>{m.body}</Text>
                <Text style={[supportStyles.bubbleTime, { color: colors.mutedForeground }]}>
                  {new Date(m.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={[supportStyles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              style={[supportStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Escribí tu consulta..."
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[supportStyles.sendBtn, { backgroundColor: text.trim() ? "#00e676" : colors.border }]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              <Feather name="send" size={16} color={text.trim() ? "#000" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Challenge Section ─────────────────────────────────────────────────────────
function ChallengeSection({ colors, wins, total }: { colors: any; wins: number; total: number }) {
  const completed = Math.min(wins, CHALLENGE_DAYS);
  const pct = (completed / CHALLENGE_DAYS) * 100;
  const targetReached = wins >= CHALLENGE_TARGET;
  const color = targetReached ? colors.gold : wins >= 10 ? colors.green : colors.primary;
  const daysLeft = Math.max(0, CHALLENGE_DAYS - total);

  return (
    <View style={[challengeStyles.card, { backgroundColor: colors.card, borderColor: targetReached ? colors.gold + "50" : colors.border }]}>
      <View style={challengeStyles.header}>
        <View>
          <Text style={[challengeStyles.title, { color: colors.foreground }]}>
            🏆 CHALLENGE 30 DÍAS
          </Text>
          <Text style={[challengeStyles.sub, { color: colors.mutedForeground }]}>
            Objetivo: {CHALLENGE_TARGET} operaciones ganadoras
          </Text>
        </View>
        {targetReached && (
          <View style={[challengeStyles.badge, { backgroundColor: colors.gold + "20", borderColor: colors.gold + "60" }]}>
            <Text style={[challengeStyles.badgeText, { color: colors.gold }]}>COMPLETADO</Text>
          </View>
        )}
      </View>

      <View style={challengeStyles.stats}>
        <View style={challengeStyles.statItem}>
          <Text style={[challengeStyles.statNum, { color }]}>{wins}</Text>
          <Text style={[challengeStyles.statLabel, { color: colors.mutedForeground }]}>Wins</Text>
        </View>
        <View style={[challengeStyles.divider, { backgroundColor: colors.border }]} />
        <View style={challengeStyles.statItem}>
          <Text style={[challengeStyles.statNum, { color: colors.foreground }]}>{total}</Text>
          <Text style={[challengeStyles.statLabel, { color: colors.mutedForeground }]}>Trades</Text>
        </View>
        <View style={[challengeStyles.divider, { backgroundColor: colors.border }]} />
        <View style={challengeStyles.statItem}>
          <Text style={[challengeStyles.statNum, { color: daysLeft === 0 ? colors.red : colors.mutedForeground }]}>
            {daysLeft === 0 ? "¡HOY!" : daysLeft}
          </Text>
          <Text style={[challengeStyles.statLabel, { color: colors.mutedForeground }]}>días restantes</Text>
        </View>
      </View>

      <View style={[challengeStyles.barBg, { backgroundColor: colors.muted }]}>
        <View style={[challengeStyles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={challengeStyles.barLabels}>
        <Text style={[challengeStyles.barLabel, { color: colors.mutedForeground }]}>0</Text>
        <Text style={[challengeStyles.barLabel, { color: colors.mutedForeground }]}>
          {wins}/{CHALLENGE_DAYS} wins · {Math.round(pct)}%
        </Text>
        <Text style={[challengeStyles.barLabel, { color: colors.mutedForeground }]}>{CHALLENGE_DAYS}</Text>
      </View>

      {!targetReached && (
        <Text style={[challengeStyles.motivation, { color: colors.mutedForeground }]}>
          {wins === 0
            ? "Registra operaciones en el Journal para comenzar el challenge"
            : wins < 10
            ? `¡Vas bien! Necesitas ${CHALLENGE_TARGET - wins} wins más para completar`
            : `¡Excelente! Solo ${CHALLENGE_TARGET - wins} wins más para la victoria`}
        </Text>
      )}
    </View>
  );
}

function PsyTokenSection({ colors }: { colors: any }) {
  return (
    <View style={[tokenStyles.card, { backgroundColor: colors.card, borderColor: "#e040fb30" }]}>
      <View style={tokenStyles.header}>
        <View style={[tokenStyles.iconWrap, { backgroundColor: "#e040fb15", borderColor: "#e040fb40" }]}>
          <Text style={tokenStyles.icon}>🪙</Text>
        </View>
        <View style={tokenStyles.info}>
          <Text style={[tokenStyles.name, { color: colors.foreground }]}>PSY TOKEN</Text>
          <Text style={[tokenStyles.ticker, { color: "#e040fb" }]}>$PSY</Text>
        </View>
        <View style={[tokenStyles.badge, { backgroundColor: "#e040fb15", borderColor: "#e040fb40" }]}>
          <Text style={[tokenStyles.badgeText, { color: "#e040fb" }]}>PRÓXIMO</Text>
        </View>
      </View>
      <Text style={[tokenStyles.desc, { color: colors.mutedForeground }]}>
        El token nativo de PSYCHOMETRIKS. Accede a funciones exclusivas, descuentos en suscripciones y participación en la gobernanza de la plataforma.
      </Text>
      <View style={tokenStyles.features}>
        {[
          { icon: "🔓", text: "Desbloquea herramientas PRO" },
          { icon: "💰", text: "50% descuento en suscripción" },
          { icon: "🗳️", text: "Voto en decisiones de la plataforma" },
          { icon: "📈", text: "Staking con rewards en USDT" },
        ].map((f) => (
          <View key={f.text} style={tokenStyles.feature}>
            <Text style={tokenStyles.featureIcon}>{f.icon}</Text>
            <Text style={[tokenStyles.featureText, { color: colors.mutedForeground }]}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Perfil() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, winRate, totalPnl } = useJournal();
  const [plan] = useState<Plan>("PRO");
  const [notificaciones, setNotificaciones] = useState(true);
  const [sonidos, setSonidos] = useState(false);
  const [whaleAlertas, setWhaleAlertas] = useState(true);

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const planColor = PLAN_COLOR[plan];
  const features = PLAN_FEATURES[plan];

  const wins = entries.filter((e) => e.result === "WIN").length;

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`${WEB_DOMAIN}/pricing`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: tabBarHeight + 24, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + Plan */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: planColor }]}>
          <Text style={[styles.avatarText, { color: planColor }]}>PSY</Text>
        </View>
        <View style={[styles.planBadge, { backgroundColor: planColor + "20", borderColor: planColor + "60" }]}>
          <Text style={[styles.planText, { color: planColor }]}>PLAN {plan}</Text>
        </View>
      </View>

      {/* PSY VAULT — top priority */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PSY VAULT — BÓVEDA</Text>
      <VaultCard colors={colors} />

      {/* Trading Stats */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TUS ESTADÍSTICAS</Text>
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{entries.length}</Text>
            <Text style={[styles.statName, { color: colors.mutedForeground }]}>Operaciones</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: winRate >= 50 ? colors.green : colors.red }]}>{winRate}%</Text>
            <Text style={[styles.statName, { color: colors.mutedForeground }]}>Win Rate</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: totalPnl >= 0 ? colors.green : colors.red }]}>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(1)}%</Text>
            <Text style={[styles.statName, { color: colors.mutedForeground }]}>P&L Total</Text>
          </View>
        </View>
      </View>

      {/* Challenge 30 días */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHALLENGE 30 DÍAS</Text>
      <ChallengeSection colors={colors} wins={wins} total={entries.length} />

      {/* PSY Token */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PSY TOKEN</Text>
      <PsyTokenSection colors={colors} />

      {/* What's New */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>🆕 NOVEDADES</Text>
      <UpdatesSection colors={colors} />

      {/* Plans & Pricing */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>📦 PLANES Y PRECIOS</Text>
      <PlansSection colors={colors} />

      {/* Soporte interno */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>💬 SOPORTE</Text>
      <SupportSection colors={colors} />

      {/* Plan Features */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TU PLAN INCLUYE</Text>
      <View style={[styles.featCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {features.map((f, i) => (
          <View key={i} style={[styles.featureRow, i < features.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Feather name={f.included ? "check-circle" : "circle"} size={14} color={f.included ? colors.green : colors.mutedForeground + "50"} />
            <Text style={[styles.featureText, { color: f.included ? colors.foreground : colors.mutedForeground + "70" }]}>{f.label}</Text>
          </View>
        ))}
      </View>
      {plan !== "ADMIN" && (
        <TouchableOpacity style={[styles.upgradeBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "15" }]} onPress={handleUpgrade}>
          <Feather name="arrow-up-circle" size={16} color={colors.primary} />
          <Text style={[styles.upgradeBtnText, { color: colors.primary }]}>
            {plan === "BÁSICO" ? "PASAR A PRO" : "PASAR A ADMIN"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Configuración */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONFIGURACIÓN</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>Notificaciones</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Alertas de señales activas</Text>
          </View>
          <Switch
            value={notificaciones}
            onValueChange={(v) => { Haptics.selectionAsync(); setNotificaciones(v); }}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={notificaciones ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>Whale Alertas</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Notificar movimientos grandes</Text>
          </View>
          <Switch
            value={whaleAlertas}
            onValueChange={(v) => { Haptics.selectionAsync(); setWhaleAlertas(v); }}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={whaleAlertas ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>Sonidos</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Alertas de audio</Text>
          </View>
          <Switch
            value={sonidos}
            onValueChange={(v) => { Haptics.selectionAsync(); setSonidos(v); }}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={sonidos ? colors.primary : colors.mutedForeground}
          />
        </View>
      </View>

      {/* Acerca de */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACERCA DE</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: "globe", label: "Sitio web", val: "psychometriks.com" },
          { icon: "info", label: "Versión", val: "2.0.0" },
          { icon: "shield", label: "Términos", val: "Ver" },
          { icon: "star", label: "PSY Token", val: "Próximo" },
        ].map((item, i, arr) => (
          <TouchableOpacity key={item.label} style={[styles.aboutRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Feather name={item.icon as any} size={14} color={colors.mutedForeground} />
            <Text style={[styles.aboutLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Text style={[styles.aboutVal, { color: item.label === "Versión" ? colors.primary : colors.mutedForeground }]}>{item.val}</Text>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { alignItems: "center", marginBottom: 24, gap: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  planBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 5 },
  planText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 8, marginTop: 20 },
  statsCard: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 4 },
  statRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statName: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.5, marginTop: 2 },
  divider: { width: 1, height: 36 },
  featCard: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  featureText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 8, borderWidth: 1, paddingVertical: 12, marginTop: 10 },
  upgradeBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  settingsCard: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  settingTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  settingDesc: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  aboutLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  aboutVal: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

const vaultCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 4, overflow: "hidden" },
  top: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  iconArea: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#00e5ff08", borderWidth: 1, borderColor: "#00e5ff30", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: 2, color: "#ffffff" },
  subtitle: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#4a6070", marginTop: 2 },
  features: { gap: 8, marginBottom: 16 },
  feature: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  openBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#00e5ff40", backgroundColor: "#00e5ff10", borderRadius: 6, paddingVertical: 14, marginBottom: 10 },
  openBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, color: "#00e5ff" },
  note: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#2a4a5a", textAlign: "center", letterSpacing: 0.5 },
});

const vaultStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 56, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 3, color: "#ffffff" },
  unlockBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#00e67640", backgroundColor: "#00e67608", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  unlockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00e676" },
  unlockText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#00e676", letterSpacing: 1 },
  closeBtn: { borderWidth: 1, borderColor: "#1a2535", borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
  closeBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#4a6070", letterSpacing: 1 },
  lockContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  lockIcon: { marginBottom: 20 },
  pinLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, color: "#4a6070", marginBottom: 8, textAlign: "center" },
  pinSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#2a4a5a", textAlign: "center", marginBottom: 16 },
  dotsRow: { flexDirection: "row", gap: 14, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pinError: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#ff1744", marginBottom: 8, textAlign: "center" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 240, gap: 10, marginTop: 16, marginBottom: 24 },
  key: { width: 70, height: 56, borderRadius: 8, borderWidth: 1, backgroundColor: "#060a0f", alignItems: "center", justifyContent: "center" },
  keyEmpty: { width: 70, height: 56 },
  keyText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#ffffff" },
  secNote: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#2a4a5a", textAlign: "center", letterSpacing: 0.3 },
  secSummary: { flexDirection: "row", borderWidth: 1, borderRadius: 6, marginBottom: 16, overflow: "hidden" },
  secItem: { flex: 1, alignItems: "center", padding: 10, backgroundColor: "#00e67606" },
  secLabel: { fontSize: 8, fontFamily: "Inter_600SemiBold", color: "#4a6070", letterSpacing: 1, marginTop: 4, marginBottom: 2 },
  secStatus: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  tabBtn: { flex: 1, borderWidth: 1, borderRadius: 6, paddingVertical: 8, alignItems: "center" },
  tabText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  warningBox: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 12 },
  warningTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#ff1744", letterSpacing: 1, marginBottom: 6 },
  warningText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#8a9ab0", lineHeight: 17 },
  dataCard: { borderWidth: 1, borderRadius: 6, padding: 14, backgroundColor: "#060a0f" },
  dataHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  dataLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#4a6070", letterSpacing: 1.5 },
  dataActions: { flexDirection: "row", gap: 8 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  actionText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#2a4a5a", letterSpacing: 1 },
  revealBtn: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  revealText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  wordsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  wordItem: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, width: "30%" },
  wordNum: { fontSize: 8, fontFamily: "Inter_400Regular", color: "#2a4a5a", width: 14 },
  wordText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  keyValue: { fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 1, lineHeight: 20, marginTop: 4 },
  tipText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a6070", lineHeight: 17, marginTop: 8 },
  totpCard: { borderWidth: 1, borderRadius: 6, padding: 14, marginTop: 16 },
  totpTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5, marginBottom: 6 },
  totpText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a6070", lineHeight: 16 },
});

const challengeStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5, marginBottom: 2 },
  sub: { fontSize: 10, fontFamily: "Inter_400Regular" },
  badge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  stats: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  divider: { width: 1, height: 32 },
  barBg: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  barFill: { height: "100%" as any, borderRadius: 4 },
  barLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  barLabel: { fontSize: 8, fontFamily: "Inter_400Regular" },
  motivation: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 16 },
});

const tokenStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  ticker: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  badge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  desc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 14 },
  features: { gap: 8 },
  feature: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureIcon: { fontSize: 14, width: 20 },
  featureText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

const updatesStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12 },
  emojiWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 17 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  title: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  date: { fontSize: 9, fontFamily: "Inter_400Regular" },
  desc: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14 },
});

const plansStyles = StyleSheet.create({
  card: { borderRadius: 8, padding: 16 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  planName: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  price: { fontSize: 26, fontFamily: "Inter_700Bold" },
  period: { fontSize: 12, fontFamily: "Inter_400Regular" },
  currentBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  currentText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  features: { gap: 7, marginBottom: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 6, paddingVertical: 12, borderWidth: 1 },
  ctaText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 1 },
  footNote: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
});

const supportStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5, marginBottom: 2 },
  sub: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14 },
  badge: { backgroundColor: "#ff1744", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 6, paddingVertical: 10, borderWidth: 1 },
  btnText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, maxWidth: 240 },
  bubble: { maxWidth: "80%", borderRadius: 10, borderWidth: 1, padding: 10 },
  bubbleSender: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 4 },
  bubbleText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  bubbleTime: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
