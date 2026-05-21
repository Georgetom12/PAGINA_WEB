import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TradingSignal, useMarket } from "@/context/MarketContext";

type StatusFilter = "ACTIVAS" | "TODAS";

function fmtPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!n || isNaN(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.001) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(7)}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `hace ${Math.floor(h / 24)}d`;
  if (h > 0) return `hace ${h}h`;
  return `hace ${m}m`;
}

function statusColor(fullStatus: string, colors: ReturnType<typeof useColors>): string {
  if (fullStatus === "ACTIVA") return colors.green;
  if (fullStatus.startsWith("TP1")) return colors.green;
  if (fullStatus.startsWith("TP2")) return "#00c896";
  if (fullStatus.startsWith("TP3")) return "#00b4d8";
  if (fullStatus.startsWith("CERRADA")) return colors.mutedForeground;
  if (fullStatus.startsWith("INVALIDADA")) return colors.red;
  return colors.mutedForeground;
}

function SignalCard({ signal }: { signal: TradingSignal }) {
  const colors = useColors();
  const isLong = signal.direction === "LONG";
  const dirColor = isLong ? colors.green : colors.red;
  const isActive = signal.status === "ACTIVA";
  const stColor = statusColor(signal.fullStatus, colors);
  const isTelegram = signal.source === "DB";
  const hasChannel = isTelegram && signal.channelSlug && signal.channelSlug !== "default";

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.card,
        borderColor: isActive ? colors.border : colors.border + "55",
        opacity: signal.fullStatus === "INVALIDADA ❌" ? 0.55 : 1,
      },
    ]}>
      {/* Header row */}
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={styles.badgeRow}>
            <View style={[styles.dirBadge, { backgroundColor: dirColor + "20", borderColor: dirColor + "50" }]}>
              <Feather name={isLong ? "trending-up" : "trending-down"} size={10} color={dirColor} />
              <Text style={[styles.dirText, { color: dirColor }]}>{signal.direction}</Text>
            </View>
            {isTelegram && (
              <View style={[styles.tgBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
                <Feather name="send" size={8} color={colors.primary} />
                <Text style={[styles.tgText, { color: colors.primary }]}>TELEGRAM</Text>
              </View>
            )}
            {hasChannel && (
              <View style={[styles.chBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.chText, { color: colors.mutedForeground }]}>#{signal.channelSlug}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.crypto, { color: colors.foreground }]}>{signal.symbol}</Text>
          {signal.leverage && (
            <Text style={[styles.leverage, { color: colors.gold }]}>{signal.leverage} leverage</Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: stColor + "20", borderColor: stColor + "50" }]}>
            <View style={[styles.statusDot, { backgroundColor: stColor }]} />
            <Text style={[styles.statusText, { color: stColor }]}>{signal.fullStatus}</Text>
          </View>
          <Text style={[styles.timeAgoTop, { color: colors.mutedForeground }]}>{timeAgo(signal.timestamp)}</Text>
        </View>
      </View>

      {/* Price levels */}
      <View style={[styles.levels, { backgroundColor: dirColor + "08", borderColor: dirColor + "20" }]}>
        <View style={styles.levelItem}>
          <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>ENTRADA</Text>
          <Text style={[styles.levelValue, { color: colors.foreground }]}>{fmtPrice(signal.entry)}</Text>
        </View>
        <Feather name="chevrons-right" size={12} color={colors.mutedForeground} />
        <View style={styles.levelItem}>
          <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>TP1</Text>
          <Text style={[styles.levelValue, { color: colors.green }]}>{fmtPrice(signal.target)}</Text>
        </View>
        {signal.tp2 ? (
          <>
            <Feather name="chevrons-right" size={12} color={colors.mutedForeground} />
            <View style={styles.levelItem}>
              <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>TP2</Text>
              <Text style={[styles.levelValue, { color: "#00c896" }]}>{fmtPrice(signal.tp2)}</Text>
            </View>
          </>
        ) : null}
        {signal.tp3 ? (
          <>
            <Feather name="chevrons-right" size={12} color={colors.mutedForeground} />
            <View style={styles.levelItem}>
              <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>TP3</Text>
              <Text style={[styles.levelValue, { color: "#00b4d8" }]}>{fmtPrice(signal.tp3)}</Text>
            </View>
          </>
        ) : null}
        <Feather name="chevrons-right" size={12} color={colors.mutedForeground} />
        <View style={styles.levelItem}>
          <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>STOP</Text>
          <Text style={[styles.levelValue, { color: colors.red }]}>{fmtPrice(signal.stopLoss)}</Text>
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.cardBottom}>
        {signal.rr > 0 && (
          <View style={[styles.chip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>R:R</Text>
            <Text style={[styles.chipValue, { color: colors.gold }]}>{signal.rr}x</Text>
          </View>
        )}
        {!isTelegram && (
          <View style={[styles.chip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>PSY</Text>
            <Text style={[styles.chipValue, { color: colors.primary }]}>{signal.psyScore}</Text>
          </View>
        )}
        {signal.note ? (
          <Text style={[styles.note, { color: colors.mutedForeground }]} numberOfLines={1}>
            📝 {signal.note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function Senales() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signals, isLoading, refresh, dataSource } = useMarket();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVAS");

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const isLive = dataSource === "live";
  const dbCount = signals.filter((s) => s.source === "DB").length;

  const filtered = useMemo(() => {
    if (statusFilter === "ACTIVAS") return signals.filter((s) => s.status === "ACTIVA");
    return signals;
  }, [signals, statusFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerArea, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            <Text style={{ color: colors.primary }}>PSY</Text>SEÑALES
          </Text>
          <View style={[
            styles.liveBadge,
            { backgroundColor: isLive ? colors.green + "20" : colors.muted, borderColor: isLive ? colors.green + "50" : colors.border },
          ]}>
            <View style={[styles.liveDot, { backgroundColor: isLive ? colors.green : colors.mutedForeground }]} />
            <Text style={[styles.liveText, { color: isLive ? colors.green : colors.mutedForeground }]}>
              {isLive ? `${dbCount} EN VIVO` : "DEMO"}
            </Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isLive ? "Señales publicadas vía Telegram — actualizadas en tiempo real" : "Señales institucionales · Demo"}
        </Text>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                borderColor: statusFilter === "ACTIVAS" ? colors.green : colors.border,
                backgroundColor: statusFilter === "ACTIVAS" ? colors.green + "18" : "transparent",
              },
            ]}
            onPress={() => { Haptics.selectionAsync(); setStatusFilter("ACTIVAS"); }}
          >
            <View style={[styles.filterDot, { backgroundColor: statusFilter === "ACTIVAS" ? colors.green : colors.mutedForeground }]} />
            <Text style={[styles.filterText, { color: statusFilter === "ACTIVAS" ? colors.green : colors.mutedForeground }]}>ACTIVAS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                borderColor: statusFilter === "TODAS" ? colors.primary : colors.border,
                backgroundColor: statusFilter === "TODAS" ? colors.primary + "18" : "transparent",
              },
            ]}
            onPress={() => { Haptics.selectionAsync(); setStatusFilter("TODAS"); }}
          >
            <Text style={[styles.filterText, { color: statusFilter === "TODAS" ? colors.primary : colors.mutedForeground }]}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SignalCard signal={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); refresh(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLive ? (
              <>
                <Feather name="zap-off" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>Sin señales activas</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Publica una señal vía Telegram para verla aquí
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.tgCta, { backgroundColor: "#229ED915", borderColor: "#229ED940" }]}>
                  <Text style={styles.tgCtaIcon}>✈️</Text>
                  <Text style={[styles.tgCtaTitle, { color: "#2CA5E0" }]}>CANAL VIP TELEGRAM</Text>
                  <Text style={[styles.tgCtaDesc, { color: colors.mutedForeground }]}>
                    Señales en tiempo real, gemas semanales y análisis técnico con entrada, targets y stop loss.
                  </Text>
                  <TouchableOpacity
                    style={[styles.tgCtaBtn, { backgroundColor: "#229ED9" }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); void Linking.openURL("https://t.me/psychometriks_pro"); }}
                  >
                    <Text style={styles.tgCtaBtnText}>ABRIR TELEGRAM →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  subtitle: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.3, marginBottom: 12 },
  filtersRow: { flexDirection: "row", gap: 8 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 4, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  filterDot: { width: 5, height: 5, borderRadius: 2.5 },
  filterText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  card: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  cardLeft: { flex: 1, gap: 3 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 2 },
  dirBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  dirText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  tgBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  tgText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  chBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  chText: { fontSize: 8, fontFamily: "Inter_400Regular" },
  crypto: { fontSize: 20, fontFamily: "Inter_700Bold" },
  leverage: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  timeAgoTop: { fontSize: 10, fontFamily: "Inter_400Regular" },
  levels: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, borderWidth: 1, padding: 10, flexWrap: "wrap" },
  levelItem: {},
  levelLabel: { fontSize: 7, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 2 },
  levelValue: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  chipLabel: { fontSize: 8, fontFamily: "Inter_600SemiBold" },
  chipValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  note: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 16, gap: 10, width: "100%" },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
  tgCta: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  tgCtaIcon: { fontSize: 36 },
  tgCtaTitle: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  tgCtaDesc: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  tgCtaBtn: { borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  tgCtaBtnText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
});
