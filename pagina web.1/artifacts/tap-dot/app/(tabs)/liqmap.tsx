import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMarket, WhaleAlert, MarketSession } from "@/context/MarketContext";

type Section = "WHALE" | "SPOT" | "CICLOS" | "MERCADOS" | "ONCHAIN" | "NOTICIAS";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  type: "crypto" | "stocks";
  publishedAt: string;
  description?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  CoinDesk: "#f7931a",
  CoinTelegraph: "#00e5ff",
  Decrypt: "#e040fb",
  "Bitcoin Mag": "#ffd700",
  CryptoPanic: "#00e676",
  "The Block": "#7b61ff",
  Reuters: "#ff6d00",
  "Yahoo Finance": "#6200ea",
  "CNBC Markets": "#ff1744",
  "CNBC Economy": "#ff4081",
  "Investing.com": "#00b0ff",
  MarketWatch: "#00e676",
  "PSY Intel": "#00e5ff",
};
function getSrcColor(src: string) { return SOURCE_COLORS[src] ?? "#4a6070"; }

function newsTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

// ─── Live dot ─────────────────────────────────────────────────────────────────
function LiveDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return <Animated.View style={[styles.liveDot, { backgroundColor: color, opacity: pulse }]} />;
}

// ─── Whale row ────────────────────────────────────────────────────────────────
function WhaleRow({ alert, colors }: { alert: WhaleAlert; colors: any }) {
  const typeLabel: Record<WhaleAlert["type"], string> = {
    CEX_IN: "→ CEX",
    CEX_OUT: "← CEX",
    WALLET: "WALLET",
    EXCHANGE: "EXCHANGE",
    DEFI: "DeFi",
  };
  const typeIcon: Record<WhaleAlert["type"], string> = {
    CEX_IN: "arrow-down-right",
    CEX_OUT: "arrow-up-right",
    WALLET: "briefcase",
    EXCHANGE: "repeat",
    DEFI: "cpu",
  };
  const color = alert.bullish ? colors.green : colors.red;

  return (
    <View style={[styles.whaleRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.whaleIcon, { backgroundColor: color + "15", borderColor: color + "40", flexDirection: "column", height: "auto" as any, minHeight: 38, paddingVertical: 5, gap: 2 }]}>
        <Feather name={typeIcon[alert.type] as any} size={12} color={color} />
        <Text style={{ color, fontSize: 6, fontFamily: "Inter_700Bold", letterSpacing: 0.4, textAlign: "center" }}>
          {alert.symbol.replace("USDT","").replace("BTC","BTC").slice(0, 5)}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.whaleSym, { color: colors.foreground }]}>{alert.symbol}</Text>
          <Text style={[styles.whaleType, { color: colors.mutedForeground }]}>{typeLabel[alert.type]}</Text>
          <View style={[styles.whaleBull, { backgroundColor: color + "15", borderColor: color + "40" }]}>
            <Text style={[styles.whaleBullText, { color }]}>{alert.bullish ? "BULL" : "BEAR"}</Text>
          </View>
        </View>
        <Text style={[styles.whaleRoute, { color: colors.mutedForeground }]} numberOfLines={1}>
          {alert.from} → {alert.to}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={[styles.whaleAmt, { color }]}>{fmtUsd(alert.amountUsd)}</Text>
        <Text style={[styles.whaleTime, { color: colors.mutedForeground }]}>{timeAgo(alert.timestamp)}</Text>
      </View>
    </View>
  );
}

// ─── Spot vs Perp bar ─────────────────────────────────────────────────────────
function SpotPerpBar({ label, spot, perp, colors }: { label: string; spot: number; perp: number; colors: any }) {
  const diff = ((perp - spot) / spot) * 100;
  const isPos = diff > 0;
  const barW = Math.min(Math.abs(diff) * 30, 100);
  return (
    <View style={[styles.spRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.spLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.spBars}>
        <View style={[styles.spBarWrap, { backgroundColor: colors.muted }]}>
          <View style={[styles.spBarFill, {
            width: `${barW}%` as any,
            backgroundColor: isPos ? colors.green : colors.red,
            alignSelf: isPos ? "flex-end" : "flex-start",
          }]} />
        </View>
      </View>
      <Text style={[styles.spDiff, { color: isPos ? colors.green : colors.red }]}>
        {isPos ? "+" : ""}{diff.toFixed(2)}%
      </Text>
    </View>
  );
}

// ─── On-Chain historical data (mensual, Ene-Dic 2024) ─────────────────────────
const MONTHS_SHORT = ["E","F","M","A","M","J","J","A","S","O","N","D"];
const BTC_MONTHLY   = [40000,52000,63000,65000,57000,60000,58000,60000,63000,70000,88000,95000];
const HASH_MONTHLY  = [520,560,600,625,580,590,595,620,640,660,700,720]; // EH/s
const DOM_MONTHLY   = [51,52,54,56,55,54,53,55,56,57,58,60];            // %
const TOTAL1_M      = [1.7,2.0,2.5,2.6,2.3,2.3,2.2,2.3,2.5,2.7,3.3,3.6];   // $T
const TOTAL2_M      = [0.83,1.0,1.3,1.3,1.1,1.1,1.0,1.1,1.2,1.2,1.4,1.5]; // $T
const TOTAL3_M      = [500,580,690,700,600,600,550,590,640,650,750,800];     // $B

// ─── MiniSparkline ─────────────────────────────────────────────────────────────
function MiniSparkline({
  data, color, height = 52,
}: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: 2 }}>
      {data.map((val, i) => {
        const h = Math.max(4, ((val - min) / range) * (height - 4) + 4);
        const opacity = 0.45 + 0.55 * (i / (data.length - 1));
        return (
          <View key={i} style={{ flex: 1, height: h, backgroundColor: color,
            borderRadius: 2, opacity }} />
        );
      })}
    </View>
  );
}

// ─── DualChartCard ─────────────────────────────────────────────────────────────
function DualChartCard({
  title, desc, dataA, dataB, colorA, colorB, labelA, labelB, months, colors,
}: {
  title: string; desc: string;
  dataA: number[]; dataB: number[];
  colorA: string; colorB: string;
  labelA: string; labelB: string;
  months: string[]; colors: any;
}) {
  const lastA = dataA[dataA.length - 1];
  const prevA = dataA[dataA.length - 2];
  const lastB = dataB[dataB.length - 1];
  const prevB = dataB[dataB.length - 2];
  const deltaA = ((lastA - prevA) / prevA * 100).toFixed(1);
  const deltaB = ((lastB - prevB) / prevB * 100).toFixed(1);
  const upA = lastA >= prevA;
  const upB = lastB >= prevB;

  return (
    <View style={[dStyles.dCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[dStyles.dTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[dStyles.dDesc, { color: colors.mutedForeground }]}>{desc}</Text>

      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colorA }} />
          <Text style={[dStyles.legendText, { color: colors.mutedForeground }]}>{labelA}</Text>
          <Text style={{ color: upA ? colors.green : colors.red, fontSize: 10, fontFamily: "Inter_700Bold" }}>
            {upA ? "↑" : "↓"}{Math.abs(parseFloat(deltaA))}%
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colorB }} />
          <Text style={[dStyles.legendText, { color: colors.mutedForeground }]}>{labelB}</Text>
          <Text style={{ color: upB ? colors.green : colors.red, fontSize: 10, fontFamily: "Inter_700Bold" }}>
            {upB ? "↑" : "↓"}{Math.abs(parseFloat(deltaB))}%
          </Text>
        </View>
      </View>

      {/* Chart A */}
      <MiniSparkline data={dataA} color={colorA} height={50} />
      {/* Chart B */}
      <View style={{ marginTop: 4 }}>
        <MiniSparkline data={dataB} color={colorB} height={36} />
      </View>

      {/* X-axis months */}
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {months.map((m, i) => (
          <Text key={i} style={[dStyles.monthLabel, { color: colors.mutedForeground, flex: 1 }]}>{m}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── ReactionTable ─────────────────────────────────────────────────────────────
function ReactionTable({
  rows, colors,
}: {
  rows: { metric: string; up: string; upColor: string; down: string; downColor: string }[];
  colors: any;
}) {
  return (
    <View style={[dStyles.rTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[dStyles.rHeader, { borderBottomColor: colors.border }]}>
        <Text style={[dStyles.rHeaderCell, { color: colors.mutedForeground, flex: 2 }]}>MÉTRICA</Text>
        <Text style={[dStyles.rHeaderCell, { color: colors.green, flex: 3 }]}>SI SUBE ↑ → BTC</Text>
        <Text style={[dStyles.rHeaderCell, { color: colors.red, flex: 3 }]}>SI BAJA ↓ → BTC</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[dStyles.rRow, { borderBottomColor: colors.border }]}>
          <Text style={[dStyles.rMetric, { color: colors.foreground, flex: 2 }]}>{r.metric}</Text>
          <Text style={[dStyles.rCell, { color: r.upColor, flex: 3 }]}>{r.up}</Text>
          <Text style={[dStyles.rCell, { color: r.downColor, flex: 3 }]}>{r.down}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── MultiSparkCard ────────────────────────────────────────────────────────────
function MultiSparkCard({
  title, series, months, colors,
}: {
  title: string;
  series: { label: string; data: number[]; color: string; fmt: (v: number) => string }[];
  months: string[];
  colors: any;
}) {
  return (
    <View style={[dStyles.dCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[dStyles.dTitle, { color: colors.foreground }]}>{title}</Text>
      {series.map((s, si) => {
        const last = s.data[s.data.length - 1];
        const prev = s.data[s.data.length - 2];
        const delta = ((last - prev) / prev * 100).toFixed(1);
        const up = last >= prev;
        return (
          <View key={si} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color }} />
                <Text style={[dStyles.legendText, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[dStyles.legendText, { color: colors.foreground }]}>{s.fmt(last)}</Text>
                <Text style={{ color: up ? colors.green : colors.red, fontSize: 10, fontFamily: "Inter_700Bold" }}>
                  {up ? "↑" : "↓"}{Math.abs(parseFloat(delta))}%
                </Text>
              </View>
            </View>
            <MiniSparkline data={s.data} color={s.color} height={40} />
          </View>
        );
      })}
      <View style={{ flexDirection: "row", marginTop: 2 }}>
        {months.map((m, i) => (
          <Text key={i} style={[dStyles.monthLabel, { color: colors.mutedForeground, flex: 1 }]}>{m}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Ciclo BTC card ───────────────────────────────────────────────────────────
const BTC_CYCLES = [
  { label: "Halvings",    value: "2012 · 2016 · 2020 · 2024", color: "#ffd700" },
  { label: "Último halving", value: "19 Abr 2024",            color: "#00e5ff" },
  { label: "Próximo halving", value: "~2028",                  color: "#00e676" },
  { label: "Fase actual",  value: "Post-Halving Bull",         color: "#ff6d00" },
  { label: "Ciclo actual", value: "Ciclo 5 · Año 1/4",        color: "#e040fb" },
  { label: "ATH previo",  value: "$69,000 (Nov 2021)",        color: "#7c4dff" },
  { label: "ATH actual",  value: "$108,000+ (2024)",          color: "#00e676" },
  { label: "RSI mensual", value: "Zona 65-80 (bull market)",  color: "#00e5ff" },
];

// ─── Market session ───────────────────────────────────────────────────────────
function SessionRow({ session, colors }: { session: MarketSession; colors: any }) {
  const color = session.open ? colors.green : colors.mutedForeground;
  return (
    <View style={[styles.sessionRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.sessionDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.sessionName, { color: session.open ? colors.foreground : colors.mutedForeground }]}>
          {session.name}
        </Text>
        {!session.open && session.opensIn && (
          <Text style={[styles.sessionSub, { color: colors.mutedForeground }]}>Abre en {session.opensIn}</Text>
        )}
      </View>
      <View style={[styles.sessionBadge, {
        backgroundColor: session.open ? colors.green + "15" : colors.muted,
        borderColor: session.open ? colors.green + "40" : colors.border,
      }]}>
        <Text style={[styles.sessionStatus, { color: session.open ? colors.green : colors.mutedForeground }]}>
          {session.open ? "ABIERTO" : "CERRADO"}
        </Text>
      </View>
    </View>
  );
}

// ─── SIMULATED spot/perp divergence data ─────────────────────────────────────
const SPOT_PERP_DATA = [
  { label: "BTC/USDT",  spot: 96400, perp: 96690 },
  { label: "ETH/USDT",  spot: 1820,  perp: 1826  },
  { label: "SOL/USDT",  spot: 148.2, perp: 148.8 },
  { label: "BNB/USDT",  spot: 598,   perp: 599.2 },
  { label: "AVAX/USDT", spot: 19.8,  perp: 19.6  },
  { label: "LINK/USDT", spot: 13.4,  perp: 13.35 },
];

// ─── LiqMap tab ───────────────────────────────────────────────────────────────
export default function LiqMap() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { whaleAlerts, marketSessions, isLoading, refresh, btcPrice } = useMarket();
  const [section, setSection] = useState<Section>("WHALE");
  const [newsTab, setNewsTab] = useState<"crypto" | "stocks">("crypto");
  const [cryptoNews, setCryptoNews] = useState<NewsItem[]>([]);
  const [stocksNews, setStocksNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const newsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const API_BASE = (() => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    return domain ? `https://${domain}` : "https://api.psychometriks.trade";
  })();

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const [cr, sr] = await Promise.all([
        fetch(`${API_BASE}/api/news?type=crypto`),
        fetch(`${API_BASE}/api/news?type=stocks`),
      ]);
      const cd = await cr.json();
      const sd = await sr.json();
      if (cd.ok) setCryptoNews(cd.items);
      if (sd.ok) setStocksNews(sd.items);
    } catch {
      // ignore — keep previous data
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (section === "NOTICIAS" && cryptoNews.length === 0) {
      fetchNews();
    }
  }, [section]);

  useEffect(() => {
    if (section === "NOTICIAS") {
      newsTimerRef.current = setInterval(fetchNews, 10 * 60 * 1000);
    } else {
      if (newsTimerRef.current) clearInterval(newsTimerRef.current);
    }
    return () => { if (newsTimerRef.current) clearInterval(newsTimerRef.current); };
  }, [section]);

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const SECTIONS: { id: Section; icon: string; label: string }[] = [
    { id: "WHALE",    icon: "activity",    label: "WHALE" },
    { id: "SPOT",     icon: "bar-chart-2", label: "SPOT/PERP" },
    { id: "CICLOS",   icon: "clock",       label: "CICLOS BTC" },
    { id: "MERCADOS", icon: "globe",       label: "MERCADOS" },
    { id: "ONCHAIN",  icon: "trending-up", label: "ON-CHAIN" },
    { id: "NOTICIAS", icon: "radio",       label: "NOTICIAS" },
  ];

  const openSessions = marketSessions.filter(s => s.open).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: tabBarHeight + 24, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); refresh(); }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.brand, { color: colors.primary }]}>LIQ</Text>
          <Text style={[styles.brandSub, { color: colors.foreground }]}>MAP</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={styles.headerBadgeRow}>
            <LiveDot color={colors.red} />
            <Text style={[styles.liveLabel, { color: colors.red }]}>LIVE</Text>
          </View>
          <Text style={[styles.btcPrice, { color: colors.foreground }]}>
            BTC ${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={styles.sectionRow}>
          {SECTIONS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.sectionBtn, {
                backgroundColor: section === s.id ? colors.primary + "20" : colors.card,
                borderColor: section === s.id ? colors.primary : colors.border,
              }]}
              onPress={() => { Haptics.selectionAsync(); setSection(s.id); }}
            >
              <Feather name={s.icon as any} size={12} color={section === s.id ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.sectionLabel, { color: section === s.id ? colors.primary : colors.mutedForeground }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Whale Alert ── */}
      {section === "WHALE" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🐋 WHALE ALERT</Text>
            <View style={[styles.liveBadge, { borderColor: colors.red + "60", backgroundColor: colors.red + "15" }]}>
              <LiveDot color={colors.red} />
              <Text style={[styles.liveBadgeText, { color: colors.red }]}>TIEMPO REAL</Text>
            </View>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Movimientos on-chain superiores a $1M · Actualizado cada 3 min
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {whaleAlerts.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Cargando whale alerts...</Text>
            ) : (
              whaleAlerts.map(a => <WhaleRow key={a.id} alert={a} colors={colors} />)
            )}
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>¿Cómo interpretar las whales?</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • <Text style={{ color: colors.green }}>CEX_OUT →</Text> Fondos saliendo de exchange (bullish — acumulación){"\n"}
              • <Text style={{ color: colors.red }}>CEX_IN →</Text> Fondos entrando al exchange (bearish — presión venta){"\n"}
              • <Text style={{ color: colors.primary }}>WALLET →</Text> Movimiento entre wallets privadas{"\n"}
              • <Text style={{ color: colors.gold }}>DeFi →</Text> Depósito/retiro en protocolo DeFi
            </Text>
          </View>
        </>
      )}

      {/* ── Spot vs Perp ── */}
      {section === "SPOT" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 SPOT vs PERPETUOS</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Divergencia entre precio spot y futuros perpetuos · Base positiva = larga demanda
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.spHeader}>
              <Text style={[styles.spHeaderText, { color: colors.mutedForeground }]}>PAR</Text>
              <Text style={[styles.spHeaderText, { color: colors.mutedForeground }]}>BASE</Text>
              <Text style={[styles.spHeaderText, { color: colors.mutedForeground }]}>DIFERENCIA</Text>
            </View>
            {SPOT_PERP_DATA.map(item => (
              <SpotPerpBar key={item.label} {...item} colors={colors} />
            ))}
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Interpretación</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • <Text style={{ color: colors.green }}>Base positiva →</Text> Mercado alcista, longs dominan{"\n"}
              • <Text style={{ color: colors.red }}>Base negativa →</Text> Backwardation, presión bajista{"\n"}
              • <Text style={{ color: colors.primary }}>Base {">"} 0.5% →</Text> Peligro de cascada de liquidaciones long{"\n"}
              • <Text style={{ color: colors.gold }}>Base {"<"} -0.3% →</Text> Oportunidad de compra spot
            </Text>
          </View>
        </>
      )}

      {/* ── Ciclos BTC ── */}
      {section === "CICLOS" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>₿ CICLOS BITCOIN</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Datos del ciclo actual de 4 años · Post-halving 2024
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {BTC_CYCLES.map((item, i) => (
              <View key={i} style={[styles.cycleRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cycleLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.cycleValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.phaseCard, { backgroundColor: "#ff6d00" + "10", borderColor: "#ff6d00" + "40" }]}>
            <Text style={[styles.phaseTitle, { color: "#ff6d00" }]}>FASE ACTUAL: POST-HALVING</Text>
            <Text style={[styles.phaseDesc, { color: colors.mutedForeground }]}>
              Históricamente los 12-18 meses posteriores al halving representan el pico del ciclo alcista.
              El RSI mensual en zona 65-80 confirma momentum positivo sin sobrecompra extrema.
            </Text>
            <View style={[styles.phaseBarWrap, { backgroundColor: colors.muted, marginTop: 12 }]}>
              <View style={[styles.phaseBarFill, { width: "35%" as any, backgroundColor: "#ff6d00" }]} />
            </View>
            <View style={styles.phaseBarLabels}>
              <Text style={[styles.phaseBarLabel, { color: colors.mutedForeground }]}>Halving</Text>
              <Text style={[styles.phaseBarLabel, { color: "#ff6d00" }]}>Ahora (35%)</Text>
              <Text style={[styles.phaseBarLabel, { color: colors.mutedForeground }]}>Pico</Text>
            </View>
          </View>

          {/* BTC vs MINERÍA */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: "#ff6d00" + "40", marginTop: 12 }]}>
            <Text style={[styles.infoTitle, { color: "#ff6d00" }]}>⛏️ BTC vs COSTO DE MINERÍA</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Cuando BTC cae por debajo del costo de producción, históricamente marca un fondo de ciclo.
            </Text>
            {[
              { label: "Costo promedio global (2024)", value: "~$45,000", color: "#ff6d00" },
              { label: "Costo minero eficiente (S21)",  value: "~$30,000", color: "#ffd700" },
              { label: "Precio actual vs costo",         value: ">2× — rentable", color: "#00e676" },
            ].map(item => (
              <View key={item.label} style={[styles.cycleRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cycleLabel, { color: colors.mutedForeground, flex: 1 }]}>{item.label}</Text>
                <Text style={[styles.cycleValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
            <Text style={[styles.infoText, { color: colors.mutedForeground, marginTop: 8 }]}>
              {"• "}<Text style={{ color: "#ff6d00" }}>{"BTC < costo →"}</Text>{" Zona de compra histórica.\n"}
              {"• "}<Text style={{ color: "#00e676" }}>{"BTC > 2× costo →"}</Text>{" Mineros rentables, acumulando.\n"}
              {"• "}<Text style={{ color: "#ffd700" }}>{"BTC > 4× costo →"}</Text>{" Mineros vendiendo — vigilar techo."}
            </Text>
          </View>
        </>
      )}

      {/* ── Mercados ── */}
      {section === "MERCADOS" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🌍 MARKET HOURS</Text>
            <View style={[styles.openBadge, {
              backgroundColor: colors.green + "15",
              borderColor: colors.green + "40",
            }]}>
              <Text style={[styles.openBadgeText, { color: colors.green }]}>{openSessions} ABIERTOS</Text>
            </View>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Estado actual de los principales mercados financieros globales
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {marketSessions.map(s => <SessionRow key={s.shortName} session={s} colors={colors} />)}
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Mejores ventanas de trading</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • <Text style={{ color: colors.gold }}>08:00-10:00 UTC →</Text> Apertura Londres — alta volatilidad{"\n"}
              • <Text style={{ color: colors.green }}>13:00-15:00 UTC →</Text> Overlap Londres/NY — máxima liquidez{"\n"}
              • <Text style={{ color: colors.primary }}>14:30 UTC →</Text> Apertura Wall Street — movimientos bruscos{"\n"}
              • <Text style={{ color: colors.mutedForeground }}>02:00-07:00 UTC →</Text> Sesión Asia — más tranquila
            </Text>
          </View>
        </>
      )}

      {/* ── ON-CHAIN ── */}
      {section === "ONCHAIN" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📡 ON-CHAIN METRICS</Text>
            <View style={[styles.liveBadge, { borderColor: colors.primary + "60", backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.liveBadgeText, { color: colors.primary }]}>2024 DATA</Text>
            </View>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Correlaciones clave para tomar decisiones con fundamento · Datos mensuales 2024
          </Text>

          {/* ── 1. BTC vs HASH RATE ── */}
          <Text style={[dStyles.groupLabel, { color: colors.primary }]}>① BTC PRICE vs HASH RATE</Text>
          <DualChartCard
            title="Precio BTC vs Hash Rate de mineros"
            desc="El hash rate mide el poder computacional dedicado a minar BTC. Es un indicador de confianza de los mineros en el precio futuro."
            dataA={BTC_MONTHLY}
            dataB={HASH_MONTHLY}
            colorA="#f7931a"
            colorB="#00e5ff"
            labelA="BTC Price"
            labelB="Hash Rate EH/s"
            months={MONTHS_SHORT}
            colors={colors}
          />

          <ReactionTable
            colors={colors}
            rows={[
              {
                metric: "Hash Rate",
                up: "Mineros confían → largo plazo ALCISTA 🟢",
                upColor: colors.green,
                down: "Capitulación minera → presión venta corto plazo 🔴",
                downColor: colors.red,
              },
              {
                metric: "Hash Rate ATH",
                up: "Red más segura → demanda institucional ↑",
                upColor: colors.green,
                down: "Miners off → bearish señal macro",
                downColor: colors.red,
              },
            ]}
          />

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>¿Por qué importa el Hash Rate?</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • <Text style={{ color: "#f7931a" }}>Hash Rate subiendo →</Text> Mineros invierten más → confían en BTC largo plazo{"\n"}
              • <Text style={{ color: colors.red }}>Capitulación minera →</Text> Hash cae fuerte → presión bajista temporal → luego suele ser SUELO{"\n"}
              • <Text style={{ color: colors.primary }}>Hash Rate en ATH →</Text> Señal alcista estructural — nunca ha tocado ATH en bear market prolongado{"\n"}
              • <Text style={{ color: colors.gold }}>Halving 2024 →</Text> Redujo recompensa a 3.125 BTC — los mineros ineficientes capitulan primero
            </Text>
          </View>

          {/* ── 2. BTC vs DOMINANCIA ── */}
          <Text style={[dStyles.groupLabel, { color: "#e040fb" }]}>② BTC vs DOMINANCIA BTC</Text>
          <DualChartCard
            title="Precio BTC vs Dominancia del mercado"
            desc="La dominancia indica qué % del total de crypto está en BTC. Alta dominancia = flujo hacia BTC. Baja = flujo hacia altcoins."
            dataA={BTC_MONTHLY}
            dataB={DOM_MONTHLY}
            colorA="#f7931a"
            colorB="#e040fb"
            labelA="BTC Price"
            labelB="Dominancia %"
            months={MONTHS_SHORT}
            colors={colors}
          />

          <ReactionTable
            colors={colors}
            rows={[
              {
                metric: "Dominancia",
                up: "Capital fluye a BTC → altcoins sufren 🔴",
                upColor: colors.green,
                down: "AltSeason — BTC puede subir pero alts más 🟡",
                downColor: colors.gold,
              },
              {
                metric: "Dom > 60%",
                up: "Mercado en modo 'safety' → BTC es el refugio",
                upColor: colors.green,
                down: "Si cae de 60% → altcoins explotan al alza",
                downColor: colors.gold,
              },
              {
                metric: "Dom < 45%",
                up: "AltSeason activa → BTC puede lateralizar",
                upColor: colors.gold,
                down: "Mercado en panic — todo cae junto",
                downColor: colors.red,
              },
            ]}
          />

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Cómo usar la dominancia</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • <Text style={{ color: "#e040fb" }}>Dom sube + BTC sube →</Text> Bull market BTC puro — no te disperses en alts{"\n"}
              • <Text style={{ color: colors.gold }}>Dom baja + BTC sube →</Text> Alts suben más — momento de altseason{"\n"}
              • <Text style={{ color: colors.red }}>Dom sube + BTC baja →</Text> Todo cae pero BTC cae menos — reduce exposición{"\n"}
              • <Text style={{ color: colors.green }}>Dom estable 50-60% →</Text> Mercado sano, BTC lidera sin burbuja de alts
            </Text>
          </View>

          {/* ── 3. DOMINANCIA vs TOTAL1/2/3 ── */}
          <Text style={[dStyles.groupLabel, { color: colors.green }]}>③ DOMINANCIA vs TOTAL1 · TOTAL2 · TOTAL3</Text>

          <MultiSparkCard
            title="Market Caps totales del ecosistema crypto"
            months={MONTHS_SHORT}
            colors={colors}
            series={[
              {
                label: "TOTAL1 (Todo crypto)",
                data: TOTAL1_M,
                color: "#f7931a",
                fmt: (v) => `$${v.toFixed(1)}T`,
              },
              {
                label: "TOTAL2 (Sin BTC)",
                data: TOTAL2_M,
                color: "#00e5ff",
                fmt: (v) => `$${v.toFixed(2)}T`,
              },
              {
                label: "TOTAL3 (Sin BTC/ETH)",
                data: TOTAL3_M,
                color: "#00e676",
                fmt: (v) => `$${v.toFixed(0)}B`,
              },
              {
                label: "Dom BTC %",
                data: DOM_MONTHLY,
                color: "#e040fb",
                fmt: (v) => `${v.toFixed(1)}%`,
              },
            ]}
          />

          <ReactionTable
            colors={colors}
            rows={[
              {
                metric: "TOTAL1 ↑",
                up: "Mercado bull global → BTC y alts suben",
                upColor: colors.green,
                down: "Bear market sistémico → todo cae",
                downColor: colors.red,
              },
              {
                metric: "TOTAL2 ↑ + Dom ↓",
                up: "AltSeason fuerte — ETH y L1s lideran",
                upColor: colors.gold,
                down: "Alts mueren → BTC puede mantenerse",
                downColor: colors.red,
              },
              {
                metric: "TOTAL3 ↑↑",
                up: "Micro caps explotan → altseason avanzada",
                upColor: colors.gold,
                down: "Liquidez sale del ecosistema → FUGA",
                downColor: colors.red,
              },
              {
                metric: "Dom BTC ↑ + TOTAL1 ↓",
                up: "BTC es refugio → alts colapsan primero",
                upColor: colors.green,
                down: "Capitulación general — salida de crypto",
                downColor: colors.red,
              },
            ]}
          />

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Glosario TOTAL1 · TOTAL2 · TOTAL3</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              • <Text style={{ color: "#f7931a" }}>TOTAL1 →</Text> Cap de todo el mercado crypto (BTC + ETH + alts). Es el "S&P500 de crypto."{"\n"}
              • <Text style={{ color: "#00e5ff" }}>TOTAL2 →</Text> TOTAL1 sin BTC. Mide la fuerza del ecosistema altcoin + ETH.{"\n"}
              • <Text style={{ color: "#00e676" }}>TOTAL3 →</Text> TOTAL2 sin ETH. Mide solo las altcoins menores (micro/mid caps).{"\n"}
              • <Text style={{ color: "#e040fb" }}>Dominancia →</Text> TOTAL1 de BTC / TOTAL1. A mayor %, más capital relativo en BTC.{"\n\n"}
              <Text style={{ color: colors.gold }}>Estrategia PSY: </Text>Cuando TOTAL3 supera su ATH anterior, es señal de altseason profunda. Cuando la Dom cae de 50% con TOTAL1 subiendo, rotar de BTC a ETH y L1s selectivos.
            </Text>
          </View>

          {/* ── Resumen visual de señales ── */}
          <View style={[dStyles.signalBox, { backgroundColor: "#00e67610", borderColor: "#00e67640" }]}>
            <Text style={[dStyles.signalTitle, { color: colors.green }]}>📊 SEÑALES ONCHAIN ACTUALES</Text>
            {[
              { label: "Hash Rate",     signal: "ALCISTA", color: colors.green,  note: "Nuevo ATH — mineros acumulando" },
              { label: "Dominancia",    signal: "NEUTRAL",  color: colors.gold,   note: "58-60% — BTC lidera sin altseason" },
              { label: "TOTAL1",        signal: "ALCISTA", color: colors.green,  note: "$3.6T — nivel pre-ATH histórico" },
              { label: "TOTAL2",        signal: "NEUTRAL",  color: colors.gold,   note: "Alts rezagadas vs BTC" },
              { label: "TOTAL3",        signal: "DÉBIL",   color: colors.red,    note: "Micro caps sin momentum aún" },
            ].map((s, i) => (
              <View key={i} style={[dStyles.signalRow, { borderBottomColor: colors.border }]}>
                <Text style={[dStyles.signalLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[dStyles.signalNote, { color: colors.mutedForeground }]}>{s.note}</Text>
                </View>
                <View style={[dStyles.signalBadge, { backgroundColor: s.color + "20", borderColor: s.color + "50" }]}>
                  <Text style={[dStyles.signalBadgeText, { color: s.color }]}>{s.signal}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── NOTICIAS ── */}
      {section === "NOTICIAS" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📡 NOTICIAS EN VIVO</Text>
            <View style={[styles.liveBadge, { borderColor: "#00e5ff60", backgroundColor: "#00e5ff15" }]}>
              <LiveDot color="#00e5ff" />
              <Text style={[styles.liveBadgeText, { color: "#00e5ff" }]}>c/10min</Text>
            </View>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Noticias de mercado de múltiples fuentes · Alimentan al asistente PSY IA
          </Text>

          {/* Sub-tabs crypto / stocks */}
          <View style={nStyles.tabRow}>
            {(["crypto", "stocks"] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[nStyles.tabBtn, {
                  backgroundColor: newsTab === t ? "#00e5ff20" : colors.card,
                  borderColor: newsTab === t ? "#00e5ff" : colors.border,
                  flex: 1,
                }]}
                onPress={() => { Haptics.selectionAsync(); setNewsTab(t); }}
              >
                <Text style={[nStyles.tabLabel, { color: newsTab === t ? "#00e5ff" : colors.mutedForeground }]}>
                  {t === "crypto" ? "₿ CRYPTO" : "📈 BOLSA & MACRO"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Source badges */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 6, paddingRight: 8 }}>
              {(newsTab === "crypto"
                ? ["CoinDesk", "CoinTelegraph", "Decrypt", "Bitcoin Mag", "CryptoPanic", "The Block"]
                : ["Reuters", "Yahoo Finance", "CNBC Markets", "CNBC Economy", "Investing.com", "MarketWatch"]
              ).map(src => (
                <View key={src} style={[nStyles.srcBadge, { borderColor: getSrcColor(src) + "50", backgroundColor: getSrcColor(src) + "15" }]}>
                  <Text style={[nStyles.srcText, { color: getSrcColor(src) }]}>{src}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* News list */}
          {newsLoading && (cryptoNews.length === 0 && stocksNews.length === 0) ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[1,2,3,4,5].map(i => (
                <View key={i} style={[nStyles.newsRow, { borderBottomColor: colors.border, opacity: 0.5 }]}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ height: 10, backgroundColor: colors.muted, borderRadius: 4, width: "80%" }} />
                    <View style={{ height: 8, backgroundColor: colors.muted, borderRadius: 4, width: "50%" }} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(newsTab === "crypto" ? cryptoNews : stocksNews).map((item, i) => (
                <View key={i} style={[nStyles.newsRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={[nStyles.srcBadge, { borderColor: getSrcColor(item.source) + "50", backgroundColor: getSrcColor(item.source) + "15" }]}>
                        <Text style={[nStyles.srcText, { color: getSrcColor(item.source) }]}>{item.source}</Text>
                      </View>
                      <Text style={[nStyles.timeText, { color: colors.mutedForeground }]}>{newsTimeAgo(item.publishedAt)}</Text>
                    </View>
                    <Text style={[nStyles.newsTitle, { color: colors.foreground }]} numberOfLines={3}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={[nStyles.newsDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={nStyles.newsArrow}>
                    <Feather name="arrow-up-right" size={12} color={colors.mutedForeground} />
                  </View>
                </View>
              ))}
              {(newsTab === "crypto" ? cryptoNews : stocksNews).length === 0 && (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Conectando con fuentes de noticias...</Text>
                </View>
              )}
            </View>
          )}

          {/* Refresh button */}
          <TouchableOpacity
            style={[nStyles.refreshBtn, { borderColor: "#00e5ff40", backgroundColor: "#00e5ff10" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchNews(); }}
          >
            <Feather name="refresh-cw" size={12} color="#00e5ff" />
            <Text style={[nStyles.refreshText, { color: "#00e5ff" }]}>
              {newsLoading ? "Actualizando..." : "Actualizar noticias"}
            </Text>
          </TouchableOpacity>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>🤖 Integrado con PSY IA</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Estas noticias se inyectan automáticamente al asistente PSY. Cuando hagas una pregunta al chat, PSY ya sabe lo que pasó hoy y ayer en los mercados — sin que debas copiar nada.{"\n\n"}
              <Text style={{ color: "#00e5ff" }}>Fuentes crypto:</Text> CoinDesk · CoinTelegraph · Decrypt · Bitcoin Magazine · CryptoPanic · The Block{"\n\n"}
              <Text style={{ color: "#ff6d00" }}>Fuentes bolsa/macro:</Text> Reuters · Yahoo Finance · CNBC Markets · CNBC Economy · Investing.com · MarketWatch
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  brand: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  brandSub: { fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: 6, marginTop: -4 },
  headerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  btcPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  liveDot: { width: 6, height: 6, borderRadius: 3 },

  sectionRow: { flexDirection: "row", gap: 8 },
  sectionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  sectionDesc: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 12, lineHeight: 15 },

  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  liveBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  card: { borderRadius: 8, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  emptyText: { padding: 24, textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular" },

  whaleRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  whaleIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  whaleSym: { fontSize: 12, fontFamily: "Inter_700Bold" },
  whaleType: { fontSize: 9, fontFamily: "Inter_400Regular" },
  whaleBull: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  whaleBullText: { fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  whaleRoute: { fontSize: 9, fontFamily: "Inter_400Regular" },
  whaleAmt: { fontSize: 12, fontFamily: "Inter_700Bold" },
  whaleTime: { fontSize: 9, fontFamily: "Inter_400Regular" },

  spHeader: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8 },
  spHeaderText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 1, flex: 1 },
  spRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  spLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 80 },
  spBars: { flex: 1 },
  spBarWrap: { height: 6, borderRadius: 3, overflow: "hidden" },
  spBarFill: { height: "100%", borderRadius: 3 },
  spDiff: { width: 52, fontSize: 11, fontFamily: "Inter_700Bold", textAlign: "right" },

  cycleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  cycleLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cycleValue: { fontSize: 11, fontFamily: "Inter_700Bold", textAlign: "right", flex: 1, marginLeft: 8 },

  phaseCard: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 12 },
  phaseTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 8 },
  phaseDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },
  phaseBarWrap: { height: 6, borderRadius: 3, overflow: "hidden" },
  phaseBarFill: { height: "100%", borderRadius: 3 },
  phaseBarLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  phaseBarLabel: { fontSize: 9, fontFamily: "Inter_400Regular" },

  sessionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sessionSub: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 1 },
  sessionBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  sessionStatus: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  openBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  openBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  infoCard: { borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 12 },
  infoTitle: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 8, letterSpacing: 0.5 },
  infoText: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 18 },
});

// ─── dStyles — ON-CHAIN section specific ──────────────────────────────────────
const dStyles = StyleSheet.create({
  groupLabel: {
    fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5,
    marginBottom: 8, marginTop: 4,
  },

  dCard: {
    borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 12,
  },
  dTitle: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 4, letterSpacing: 0.3 },
  dDesc: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 15, marginBottom: 10 },
  legendText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  monthLabel: { fontSize: 7, fontFamily: "Inter_400Regular", textAlign: "center" },

  rTable: { borderRadius: 8, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  rHeader: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7, borderBottomWidth: 1 },
  rHeaderCell: { fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  rRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1,
  },
  rMetric: { fontSize: 9, fontFamily: "Inter_700Bold" },
  rCell: { fontSize: 9, fontFamily: "Inter_400Regular", lineHeight: 13 },

  signalBox: { borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 16 },
  signalTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 10 },
  signalRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8,
    borderBottomWidth: 1, gap: 8,
  },
  signalLabel: { fontSize: 10, fontFamily: "Inter_700Bold", width: 72 },
  signalNote: { fontSize: 9, fontFamily: "Inter_400Regular", lineHeight: 13 },
  signalBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  signalBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});

// ─── nStyles — NOTICIAS section ───────────────────────────────────────────────
const nStyles = StyleSheet.create({
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tabBtn: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 6, paddingVertical: 8 },
  tabLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  srcBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  srcText: { fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  newsRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8,
  },
  newsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  newsDesc: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 15 },
  timeText: { fontSize: 9, fontFamily: "Inter_400Regular" },
  newsArrow: { paddingTop: 4, opacity: 0.5 },

  refreshBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1, borderRadius: 6, paddingVertical: 10, marginBottom: 12,
  },
  refreshText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
});
