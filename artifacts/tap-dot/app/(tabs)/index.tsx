import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
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

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.001) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(7)}`;
}

function fmtChange(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
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

function SignalPill({ signal }: { signal: string }) {
  const colors = useColors();
  const map: Record<string, { label: string; color: string }> = {
    BUY_STRONG: { label: "BUY FUERTE", color: colors.green },
    BUY: { label: "BUY", color: "#80e5b0" },
    NEUTRAL: { label: "NEUTRAL", color: colors.mutedForeground },
    SELL: { label: "SELL", color: "#ff7070" },
    SELL_STRONG: { label: "SELL FUERTE", color: colors.red },
  };
  const { label, color } = map[signal] ?? map["NEUTRAL"];
  return (
    <View style={[styles.pill, { borderColor: color + "50", backgroundColor: color + "15" }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function WhaleRow({ alert }: { alert: WhaleAlert }) {
  const colors = useColors();
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
      <View style={[styles.whaleIconWrap, { backgroundColor: color + "15", borderColor: color + "40" }]}>
        <Feather name={typeIcon[alert.type] as any} size={12} color={color} />
      </View>
      <View style={styles.whaleInfo}>
        <View style={styles.whaleTop}>
          <Text style={[styles.whaleSymbol, { color: colors.foreground }]}>
            {alert.symbol}
          </Text>
          <Text style={[styles.whaleType, { color: colors.mutedForeground }]}>
            {typeLabel[alert.type]}
          </Text>
        </View>
        <Text style={[styles.whaleRoute, { color: colors.mutedForeground }]} numberOfLines={1}>
          {alert.from} → {alert.to}
        </Text>
      </View>
      <View style={styles.whaleRight}>
        <Text style={[styles.whaleUsd, { color }]}>{fmtUsd(alert.amountUsd)}</Text>
        <Text style={[styles.whaleTime, { color: colors.mutedForeground }]}>{timeAgo(alert.timestamp)}</Text>
      </View>
    </View>
  );
}

function SessionBadge({ session }: { session: MarketSession }) {
  const colors = useColors();
  const color = session.open ? colors.green : colors.mutedForeground;
  return (
    <View style={[styles.sessionBadge, {
      backgroundColor: session.open ? color + "15" : colors.card,
      borderColor: session.open ? color + "50" : colors.border,
    }]}>
      <View style={[styles.sessionDot, { backgroundColor: color }]} />
      <Text style={[styles.sessionName, { color: session.open ? colors.foreground : colors.mutedForeground }]}>
        {session.shortName}
      </Text>
      {!session.open && session.opensIn && (
        <Text style={[styles.sessionSub, { color: colors.mutedForeground }]}>{session.opensIn}</Text>
      )}
    </View>
  );
}

export default function Dashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    btcPrice, btcChange24h, marketBias, biasScore, assets, signals,
    fearGreedIndex, avgFundingRate, whaleAlerts, marketSessions,
    isLoading, lastUpdate, dataSource, refresh,
  } = useMarket();

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const btcPositive = btcChange24h >= 0;
  const topMovers = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5);
  const activeSigs = signals.filter((s) => s.status === "ACTIVA").length;

  const biasColor = marketBias === "ALCISTA" ? colors.green : marketBias === "BAJISTA" ? colors.red : colors.gold;

  const fearLabel = fearGreedIndex < 25 ? "MIEDO EXTREMO" : fearGreedIndex < 45 ? "MIEDO" : fearGreedIndex < 55 ? "NEUTRO" : fearGreedIndex < 75 ? "CODICIA" : "CODICIA EXTREMA";
  const fearColor = fearGreedIndex < 25 ? colors.red : fearGreedIndex < 45 ? "#ff7070" : fearGreedIndex < 55 ? colors.gold : fearGreedIndex < 75 ? "#80e5b0" : colors.green;

  const openSessions = marketSessions.filter((s) => s.open).length;

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
          <Text style={[styles.brandPsy, { color: colors.primary }]}>PSY</Text>
          <Text style={[styles.brandFull, { color: colors.foreground }]}>CHOMETRIKS</Text>
        </View>
        <View style={styles.headerRight}>
          {lastUpdate && (
            <Text style={[styles.updateTime, { color: colors.mutedForeground }]}>
              Act. {lastUpdate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          )}
          <View style={[styles.sourceBadge, {
            backgroundColor: dataSource === "live" ? colors.green + "15" : colors.mutedForeground + "15",
            borderColor: dataSource === "live" ? colors.green + "50" : colors.mutedForeground + "30",
          }]}>
            <View style={[styles.sourceDot, { backgroundColor: dataSource === "live" ? colors.green : colors.mutedForeground }]} />
            <Text style={[styles.sourceText, { color: dataSource === "live" ? colors.green : colors.mutedForeground }]}>
              {dataSource === "live" ? "LIVE" : "SIM"}
            </Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
        </View>
      </View>

      {/* Market Sessions Strip */}
      <View style={styles.sessionsRow}>
        {marketSessions.map((s) => <SessionBadge key={s.shortName} session={s} />)}
      </View>
      <Text style={[styles.sessionsLabel, { color: colors.mutedForeground }]}>
        {openSessions} mercado{openSessions !== 1 ? "s" : ""} activo{openSessions !== 1 ? "s" : ""} ahora
      </Text>

      {/* BTC Hero Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.heroBadge}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>BITCOIN PRICE</Text>
        </View>
        <Text style={[styles.heroPrice, { color: colors.foreground }]}>
          {fmtPrice(btcPrice)}
        </Text>
        <View style={styles.heroBottom}>
          <View style={[styles.changeBadge, { backgroundColor: btcPositive ? colors.green + "20" : colors.red + "20", borderColor: btcPositive ? colors.green + "50" : colors.red + "50" }]}>
            <Feather name={btcPositive ? "trending-up" : "trending-down"} size={12} color={btcPositive ? colors.green : colors.red} />
            <Text style={[styles.changeText, { color: btcPositive ? colors.green : colors.red }]}>
              {fmtChange(btcChange24h)} 24h
            </Text>
          </View>
        </View>
      </View>

      {/* Market Bias */}
      <View style={[styles.biasCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BIAS DEL MERCADO</Text>
        <View style={styles.biasRow}>
          <Text style={[styles.biasText, { color: biasColor }]}>{marketBias}</Text>
          <Text style={[styles.biasScore, { color: colors.mutedForeground }]}>Score {biasScore}/100</Text>
        </View>
        <View style={[styles.biasBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.biasFill, { width: `${biasScore}%` as any, backgroundColor: biasColor }]} />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>FEAR & GREED</Text>
          <Text style={[styles.statValue, { color: fearColor }]}>{fearGreedIndex}</Text>
          <Text style={[styles.statSub, { color: fearColor }]}>{fearLabel}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>FUNDING RATE</Text>
          <Text style={[styles.statValue, { color: avgFundingRate >= 0 ? colors.green : colors.red }]}>
            {avgFundingRate >= 0 ? "+" : ""}{(avgFundingRate * 100).toFixed(3)}%
          </Text>
          <Text style={[styles.statSub, { color: colors.mutedForeground }]}>promedio</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>SEÑALES ACTIVAS</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{activeSigs}</Text>
          <Text style={[styles.statSub, { color: colors.mutedForeground }]}>en vivo</Text>
        </View>
      </View>

      {/* Whale Alerts */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🐋 WHALE ALERT</Text>
        <View style={[styles.liveBadge, { borderColor: colors.red + "60", backgroundColor: colors.red + "15" }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.red }]} />
          <Text style={[styles.liveText, { color: colors.red }]}>LIVE</Text>
        </View>
      </View>
      <View style={[styles.whaleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {whaleAlerts.slice(0, 4).map((a) => <WhaleRow key={a.id} alert={a} />)}
        <View style={styles.whaleFooter}>
          <Text style={[styles.whaleFooterText, { color: colors.mutedForeground }]}>
            Movimientos on-chain · actualizado cada 3min
          </Text>
        </View>
      </View>

      {/* Top Movers */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>TOP MOVERS</Text>
      <View style={[styles.moversCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {topMovers.map((a, i) => (
          <View key={a.id} style={[styles.moverRow, i < topMovers.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <View style={[styles.moverIcon, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Text style={[styles.moverIconText, { color: colors.primary }]}>{a.symbol.slice(0, 2)}</Text>
            </View>
            <View style={styles.moverInfo}>
              <Text style={[styles.moverSymbol, { color: colors.foreground }]}>{a.symbol}</Text>
              <Text style={[styles.moverName, { color: colors.mutedForeground }]}>{a.name}</Text>
            </View>
            <View style={styles.moverRight}>
              <Text style={[styles.moverPrice, { color: colors.foreground }]}>{fmtPrice(a.price)}</Text>
              <Text style={[styles.moverChange, { color: a.change24h >= 0 ? colors.green : colors.red }]}>
                {fmtChange(a.change24h)}
              </Text>
            </View>
            <SignalPill signal={a.signal} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 },
  brandPsy: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  brandFull: { fontSize: 13, fontFamily: "Inter_400Regular", letterSpacing: 2, marginTop: -4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  updateTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  sourceDot: { width: 5, height: 5, borderRadius: 3 },
  sourceText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },

  sessionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  sessionsLabel: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.5, marginBottom: 14 },
  sessionBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  sessionDot: { width: 5, height: 5, borderRadius: 2.5 },
  sessionName: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  sessionSub: { fontSize: 8, fontFamily: "Inter_400Regular" },

  heroCard: { borderRadius: 8, borderWidth: 1, padding: 20, marginBottom: 12 },
  heroBadge: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  heroLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  heroPrice: { fontSize: 42, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  heroBottom: { flexDirection: "row", marginTop: 8 },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  changeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  biasCard: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 12 },
  biasRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  biasText: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  biasScore: { fontSize: 11, fontFamily: "Inter_400Regular" },
  biasBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  biasFill: { height: "100%", borderRadius: 2 },
  sectionLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 6 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 12 },
  statLabel: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statSub: { fontSize: 8, fontFamily: "Inter_400Regular", marginTop: 2, letterSpacing: 0.5 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5 },
  liveText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  whaleCard: { borderRadius: 8, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  whaleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  whaleIconWrap: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  whaleInfo: { flex: 1, gap: 2 },
  whaleTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  whaleSymbol: { fontSize: 12, fontFamily: "Inter_700Bold" },
  whaleType: { fontSize: 9, fontFamily: "Inter_400Regular" },
  whaleRoute: { fontSize: 9, fontFamily: "Inter_400Regular" },
  whaleRight: { alignItems: "flex-end", gap: 2 },
  whaleUsd: { fontSize: 12, fontFamily: "Inter_700Bold" },
  whaleTime: { fontSize: 9, fontFamily: "Inter_400Regular" },
  whaleFooter: { paddingHorizontal: 12, paddingVertical: 8 },
  whaleFooterText: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },

  moversCard: { borderRadius: 8, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  moverRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  moverIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  moverIconText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  moverInfo: { flex: 1 },
  moverSymbol: { fontSize: 13, fontFamily: "Inter_700Bold" },
  moverName: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  moverRight: { alignItems: "flex-end", marginRight: 8 },
  moverPrice: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  moverChange: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  pill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pillText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});
