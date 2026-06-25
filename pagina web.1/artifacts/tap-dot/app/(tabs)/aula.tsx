import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Level = "TODOS" | "N1" | "N2" | "N3" | "N4" | "N5" | "N6" | "N7" | "N8";

const LEVEL_META: Record<string, { label: string; color: string; desc: string }> = {
  N1: { label: "FUNDAMENTOS",    color: "#00e676", desc: "Bases del mercado" },
  N2: { label: "TÉCNICO",        color: "#00e5ff", desc: "Análisis técnico clásico" },
  N3: { label: "SMART MONEY",    color: "#ff6d00", desc: "Metodología institucional" },
  N4: { label: "AVANZADO",       color: "#ffd700", desc: "Flujo y estructura avanzada" },
  N5: { label: "MACRO",          color: "#e040fb", desc: "Macroeconómicos y ciclos" },
  N6: { label: "METODOLOGÍAS",   color: "#7c4dff", desc: "Sistemas completos" },
  N7: { label: "GESTIÓN",        color: "#ff1744", desc: "Capital y psicología" },
  N8: { label: "ACC. & R.FIJA",  color: "#40c4ff", desc: "Mercados financieros tradicionales" },
};

interface Module {
  id: string;
  number: string;
  level: string;
  title: string;
  subtitle: string;
  emoji: string;
  duration: string;
  tags: string[];
}

const MODULES: Module[] = [
  { id: "glosario-psy",         number: "00", level: "N1", title: "Glosario PSY",              subtitle: "Todos los términos del indicador PSY en TradingView",           emoji: "📖", duration: "Referencia", tags: ["Glosario","PSY"] },
  { id: "intro-mercados",       number: "01", level: "N1", title: "Intro a los Mercados",      subtitle: "Activos, exchanges, renta variable vs crypto",                  emoji: "🌐", duration: "25 min",    tags: ["Básico","Mercados"] },
  { id: "anatomia-mercado",     number: "02", level: "N1", title: "Anatomía del Mercado",      subtitle: "Bid, Ask, Spread, tipos de órdenes, liquidez",                 emoji: "🔬", duration: "20 min",    tags: ["Básico","OrderFlow"] },
  { id: "velas-basico",         number: "03", level: "N1", title: "Velas Japonesas — Básico",  subtitle: "Anatomía, tipos, psicología de cada vela",                     emoji: "🕯️", duration: "35 min",    tags: ["Velas","Básico"] },
  { id: "estructura-mercado",   number: "04", level: "N1", title: "Estructura de Mercado",     subtitle: "Tendencias, HH/HL, LH/LL, Bull vs Bear",                      emoji: "📊", duration: "30 min",    tags: ["Estructura","Básico"] },
  { id: "velas-patrones",       number: "05", level: "N2", title: "Velas — Patrones",          subtitle: "Reversión, continuación, multi-vela (80+ patrones)",           emoji: "🎯", duration: "60 min",    tags: ["Velas","Patrones"] },
  { id: "fibonacci",            number: "06", level: "N2", title: "Fibonacci Completo",        subtitle: "Retrocesos, extensiones, Golden Pocket, confluencias",          emoji: "🌀", duration: "45 min",    tags: ["Fibonacci","Niveles"] },
  { id: "emas",                 number: "07", level: "N2", title: "EMAs y Medias Móviles",     subtitle: "EMA 21/50/200, Ribbon, Golden/Death Cross",                    emoji: "〰️", duration: "30 min",    tags: ["EMAs","Tendencia"] },
  { id: "rsi",                  number: "08", level: "N2", title: "RSI — Relative Strength",   subtitle: "Sobrecompra, sobreventa, divergencias, estrategias",            emoji: "📈", duration: "35 min",    tags: ["RSI","Osciladores"] },
  { id: "sesiones",             number: "09", level: "N2", title: "Sesiones de Trading",       subtitle: "Asia, Londres, New York, Overlap — horarios clave",            emoji: "🕐", duration: "40 min",    tags: ["Sesiones","Horarios"] },
  { id: "smart-money-intro",    number: "10", level: "N3", title: "Smart Money — Intro",       subtitle: "Qué es el dinero institucional, cómo rastrearlo",              emoji: "🏦", duration: "25 min",    tags: ["SMC","Institucional"] },
  { id: "bos-choch",            number: "11", level: "N3", title: "BOS & CHoCH",              subtitle: "Break of Structure y Change of Character",                      emoji: "💥", duration: "35 min",    tags: ["BOS","CHoCH"] },
  { id: "order-blocks",         number: "12", level: "N3", title: "Order Blocks & FVG",       subtitle: "OB alcistas/bajistas, Fair Value Gaps, Breaker Blocks",         emoji: "🧱", duration: "45 min",    tags: ["OB","FVG"] },
  { id: "liquidez",             number: "13", level: "N3", title: "Liquidez y Hunts",          subtitle: "BSL, SSL, Inducements, barridas de liquidez",                  emoji: "💧", duration: "40 min",    tags: ["Liquidez","Trampas"] },
  { id: "amd",                  number: "14", level: "N3", title: "AMD",                       subtitle: "Acumulación, Manipulación, Distribución institucional",         emoji: "⚙️", duration: "40 min",    tags: ["AMD","Ciclo"] },
  { id: "crt",                  number: "15", level: "N3", title: "CRT — Candle Range Theory", subtitle: "Inside bar, range, barridas y dirección real",                 emoji: "📦", duration: "35 min",    tags: ["CRT","Rango"] },
  { id: "ipda",                 number: "16", level: "N3", title: "IPDA — Premium/Discount",   subtitle: "Equilibrium, Premium vs Discount, NWOG, NDOG",                 emoji: "⚖️", duration: "30 min",    tags: ["IPDA","Niveles"] },
  { id: "wyckoff",              number: "17", level: "N4", title: "Wyckoff — Método Completo", subtitle: "Acumulación, distribución, Spring, UTAD, SOS, SOW",            emoji: "🔮", duration: "60 min",    tags: ["Wyckoff","Ciclos"] },
  { id: "cvd",                  number: "18", level: "N4", title: "CVD — Volume Delta",        subtitle: "Qué es, cómo leerlo, divergencias, señales",                   emoji: "🌊", duration: "35 min",    tags: ["CVD","Volumen"] },
  { id: "open-interest",        number: "19", level: "N4", title: "Open Interest",             subtitle: "OI real, funding rates, liquidaciones, manipulación",           emoji: "📉", duration: "40 min",    tags: ["OI","Futuros","Funding"] },
  { id: "dominancias",          number: "20", level: "N4", title: "Dominancias Crypto",        subtitle: "BTC.D, USDT.D, USDC.D — ciclos altcoin season",               emoji: "👑", duration: "35 min",    tags: ["Dominancia","BTC"] },
  { id: "dxy",                  number: "21", level: "N5", title: "DXY — Índice del Dólar",    subtitle: "Qué es, cómo leerlo, ciclos, impacto en mercados",             emoji: "💵", duration: "40 min",    tags: ["DXY","Macro"] },
  { id: "indices",              number: "22", level: "N5", title: "Índices Bursátiles",        subtitle: "SPX, NASDAQ, Dow Jones (US30) — correlaciones BTC",            emoji: "🏛️", duration: "40 min",    tags: ["Índices","SPX"] },
  { id: "mag7",                 number: "23", level: "N5", title: "Las Magníficas 7",          subtitle: "NVDA, MSFT, AAPL, AMZN, GOOGL, META, TSLA",                  emoji: "🚀", duration: "35 min",    tags: ["MAG7","Tech"] },
  { id: "vix",                  number: "24", level: "N5", title: "VIX — Índice de Volatilidad", subtitle: "Fear index, niveles clave, inverso al SPX",                 emoji: "😱", duration: "30 min",    tags: ["VIX","Volatilidad"] },
  { id: "bonos",                number: "25", level: "N5", title: "Bonos del Tesoro 10Y",      subtitle: "Yields, curva de rendimiento, impacto en crypto",              emoji: "📜", duration: "35 min",    tags: ["Bonos","Yields"] },
  { id: "oro",                  number: "26", level: "N5", title: "Oro — XAU/USD",             subtitle: "Ciclos del oro, relación con dólar, inflación, crisis",       emoji: "🥇", duration: "35 min",    tags: ["Oro","Macro"] },
  { id: "petroleo",             number: "27", level: "N5", title: "Petróleo — WTI & Brent",    subtitle: "Ciclos, OPEC, impacto en inflación y mercados",                emoji: "🛢️", duration: "30 min",    tags: ["WTI","Petróleo"] },
  { id: "ciclos-crypto",        number: "28", level: "N5", title: "Ciclos de Bitcoin",         subtitle: "Halving, ciclo 4 años, altcoin season, patrones históricos",  emoji: "₿",  duration: "45 min",    tags: ["Bitcoin","Halving"] },
  { id: "macro-dashboard",      number: "29", level: "N5", title: "Dashboard Macro",           subtitle: "Todos los indicadores macro: VIX, DXY, Bonos, On-Chain",      emoji: "🌍", duration: "50 min",    tags: ["Macro","Dashboard"] },
  { id: "elliott-waves",        number: "30", level: "N6", title: "Ondas de Elliott",          subtitle: "5 impulsos, 3 correcciones, fractales, aplicación práctica",  emoji: "〽️", duration: "55 min",    tags: ["Elliott","Ondas"] },
  { id: "armonicos",            number: "31", level: "N6", title: "Patrones Armónicos",        subtitle: "Gartley, Bat, Butterfly, Crab, Cypher, ABCD — XABCD",        emoji: "🎼", duration: "60 min",    tags: ["Armónicos","Fibonacci"] },
  { id: "ict",                  number: "32", level: "N6", title: "ICT — Inner Circle Trader", subtitle: "PD Arrays, Killzones, Judas Swing, NWOG completo",             emoji: "🎖️", duration: "50 min",    tags: ["ICT","SMC"] },
  { id: "gann",                 number: "33", level: "N6", title: "Gann — Geometría",          subtitle: "Cuadrado de 9, ángulos, fan, grid — tiempo y precio",         emoji: "⬡",  duration: "45 min",    tags: ["Gann","Geometría"] },
  { id: "risk-management",      number: "34", level: "N7", title: "Gestión de Riesgo",         subtitle: "Regla 3-5-7, tamaño posición, R:R, Kelly, drawdown",          emoji: "🛡️", duration: "40 min",    tags: ["Riesgo","Capital"] },
  { id: "psicologia",           number: "35", level: "N7", title: "Psicología del Trader",     subtitle: "Sesgos cognitivos, FOMO, FUD, sobreoperativa, disciplina",    emoji: "🧠", duration: "35 min",    tags: ["Psicología"] },
  { id: "diario-trading",       number: "36", level: "N7", title: "Diario de Trading",         subtitle: "Cómo registrar operaciones, métricas, mejora continua",       emoji: "📓", duration: "25 min",    tags: ["Diario","Métricas"] },
  { id: "analisis-fundamental", number: "AF01", level: "N8", title: "Análisis Fundamental",   subtitle: "Estados financieros, ratios P/E, FCF, balance",                emoji: "📊", duration: "55 min",    tags: ["Acciones","Fundamental"] },
  { id: "earnings-reports",     number: "AF02", level: "N8", title: "Earnings Reports",        subtitle: "Beat & Raise, EPS, Revenue, Guidance — cómo operar",         emoji: "📋", duration: "40 min",    tags: ["Earnings","EPS"] },
  { id: "dividend-investing",   number: "AF03", level: "N8", title: "Dividend Investing",      subtitle: "Yield, DRIP, Aristocrats, fechas clave del ciclo",            emoji: "💰", duration: "35 min",    tags: ["Dividendos","Yield"] },
];

const LEVELS: Level[] = ["TODOS", "N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"];
const FREE_LEVELS = new Set(["N1", "N2"]);

const AULA_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/aula`
  : "https://psychometriks.trade/aula";

function ModuleCard({ item, colors }: { item: Module; colors: any }) {
  const meta = LEVEL_META[item.level];
  const isFree = FREE_LEVELS.has(item.level);

  function openModule() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`${AULA_DOMAIN}#${item.id}`);
  }

  return (
    <TouchableOpacity
      style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: isFree ? colors.border : meta.color + "30" }]}
      onPress={openModule}
      activeOpacity={0.75}
    >
      <View style={styles.moduleLeft}>
        <Text style={styles.moduleEmoji}>{item.emoji}</Text>
        <View style={[styles.numBadge, { backgroundColor: meta.color + "20", borderColor: meta.color + "50" }]}>
          <Text style={[styles.numText, { color: meta.color }]}>{item.number}</Text>
        </View>
      </View>
      <View style={styles.moduleContent}>
        <View style={styles.moduleTopRow}>
          <View style={[styles.levelBadge, { backgroundColor: meta.color + "15", borderColor: meta.color + "40" }]}>
            <Text style={[styles.levelText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {!isFree && (
            <View style={[styles.lockBadge, { backgroundColor: "#ffd70015", borderColor: "#ffd70040" }]}>
              <Feather name="lock" size={9} color="#ffd700" />
              <Text style={[styles.lockText, { color: "#ffd700" }]}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.moduleTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.moduleSub, { color: colors.mutedForeground }]} numberOfLines={2}>{item.subtitle}</Text>
        <View style={styles.moduleFooter}>
          <Feather name="clock" size={9} color={colors.mutedForeground} />
          <Text style={[styles.moduleDuration, { color: colors.mutedForeground }]}>{item.duration}</Text>
          {item.tags.slice(0, 2).map(t => (
            <View key={t} style={[styles.tagBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <Feather name="external-link" size={14} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export default function Aula() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeLevel, setActiveLevel] = useState<Level>("TODOS");

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const filtered = useMemo(() => {
    if (activeLevel === "TODOS") return MODULES;
    return MODULES.filter(m => m.level === activeLevel);
  }, [activeLevel]);

  const completedCount = 0;
  const totalCount = MODULES.length;

  function openAula() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(AULA_DOMAIN);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fixed */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>AULA</Text>
            <Text style={[styles.brandSub, { color: colors.foreground }]}>VIRTUAL</Text>
          </View>
          <TouchableOpacity
            style={[styles.openBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={openAula}
          >
            <Feather name="external-link" size={12} color="#000" />
            <Text style={styles.openBtnText}>ABRIR WEB</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressTop}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>TU PROGRESO</Text>
            <Text style={[styles.progressCount, { color: colors.foreground }]}>{completedCount}/{totalCount} módulos</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { width: `${(completedCount / totalCount) * 100}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
            Accede al Aula Virtual desde la web para marcar lecciones como completadas
          </Text>
        </View>

        {/* Level filters */}
        <FlatList
          data={LEVELS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={l => l}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
          renderItem={({ item: lv }) => {
            const meta = lv === "TODOS" ? null : LEVEL_META[lv];
            const active = activeLevel === lv;
            const color = meta ? meta.color : colors.primary;
            return (
              <TouchableOpacity
                style={[styles.filterBtn, {
                  backgroundColor: active ? color + "20" : colors.card,
                  borderColor: active ? color : colors.border,
                }]}
                onPress={() => { Haptics.selectionAsync(); setActiveLevel(lv); }}
              >
                <Text style={[styles.filterText, { color: active ? color : colors.mutedForeground }]}>
                  {lv === "TODOS" ? "TODOS" : lv}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {activeLevel !== "TODOS" && LEVEL_META[activeLevel] && (
          <View style={[styles.levelDesc, { backgroundColor: LEVEL_META[activeLevel].color + "10", borderColor: LEVEL_META[activeLevel].color + "30" }]}>
            <Text style={[styles.levelDescTitle, { color: LEVEL_META[activeLevel].color }]}>
              {LEVEL_META[activeLevel].label}
            </Text>
            <Text style={[styles.levelDescText, { color: colors.mutedForeground }]}>
              {LEVEL_META[activeLevel].desc} · {filtered.length} módulos
            </Text>
          </View>
        )}
      </View>

      {/* Module list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBarHeight + 24, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ModuleCard item={item} colors={colors} />}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={openAula}
          >
            <Feather name="external-link" size={14} color={colors.primary} />
            <Text style={[styles.footerBtnText, { color: colors.primary }]}>
              Ver contenido completo en el Aula Virtual
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  brand: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  brandSub: { fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 6, marginTop: -4 },
  openBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  openBtnText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 0.5 },

  progressCard: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 8 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  progressCount: { fontSize: 12, fontFamily: "Inter_700Bold" },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", borderRadius: 2 },
  progressHint: { fontSize: 9, fontFamily: "Inter_400Regular", lineHeight: 13 },

  filterBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  filterText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  levelDesc: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 8 },
  levelDescTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  levelDescText: { fontSize: 10, fontFamily: "Inter_400Regular" },

  moduleCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 8 },
  moduleLeft: { alignItems: "center", gap: 4, marginRight: 10 },
  moduleEmoji: { fontSize: 22 },
  numBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2 },
  numText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  moduleContent: { flex: 1, gap: 4 },
  moduleTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  levelBadge: { borderRadius: 3, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2 },
  levelText: { fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 2, borderRadius: 3, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 2 },
  lockText: { fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  moduleTitle: { fontSize: 12, fontFamily: "Inter_700Bold" },
  moduleSub: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14 },
  moduleFooter: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  moduleDuration: { fontSize: 9, fontFamily: "Inter_400Regular" },
  tagBadge: { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { fontSize: 7, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },

  footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 8, borderWidth: 1, padding: 16, marginTop: 4 },
  footerBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
