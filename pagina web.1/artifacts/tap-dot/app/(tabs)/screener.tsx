import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CryptoAsset, useMarket } from "@/context/MarketContext";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "https://api.psychometriks.trade";

type Filter = "TODOS" | "COMPRA" | "VENTA" | "FUERTES";

// ─── Macro types ──────────────────────────────────────────────────────────────
interface MacroQuote {
  symbol: string;
  shortName: string;
  name: string;
  price: number;
  changePct: number;
  color: string;
  btcCorr: number;
  inverse: boolean;
  live: boolean;
}

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.001) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(7)}`;
}

function fmtMacro(item: MacroQuote): string {
  if (item.shortName === "10Y" || item.shortName === "DXY") return item.price.toFixed(2);
  if (item.price >= 10000) return item.price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (item.price >= 100) return item.price.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return item.price.toFixed(2);
}

// ─── Macro card ───────────────────────────────────────────────────────────────
function MacroCard({ item, colors }: { item: MacroQuote; colors: ReturnType<typeof useColors> }) {
  const isUp = item.changePct >= 0;
  // For inverse assets (DXY, 10Y, VIX): up = bearish for BTC
  const bullishForBtc = item.inverse ? !isUp : isUp;
  const impactColor = bullishForBtc ? colors.green : colors.red;
  const arrow = isUp ? "↑" : "↓";

  return (
    <View style={[macStyles.card, { backgroundColor: colors.card, borderColor: item.color + "30" }]}>
      <View style={macStyles.cardTop}>
        <Text style={[macStyles.shortName, { color: item.color }]}>{item.shortName}</Text>
        {item.live && <View style={[macStyles.liveDot, { backgroundColor: colors.green }]} />}
      </View>
      <Text style={[macStyles.value, { color: colors.foreground }]}>{fmtMacro(item)}</Text>
      <View style={macStyles.changeRow}>
        <Text style={[macStyles.change, { color: isUp ? colors.green : colors.red }]}>
          {arrow} {Math.abs(item.changePct).toFixed(2)}%
        </Text>
      </View>
      <View style={[macStyles.corrBadge, { backgroundColor: impactColor + "15", borderColor: impactColor + "40" }]}>
        <Text style={[macStyles.corrText, { color: impactColor }]}>
          {bullishForBtc ? "✅ BTC" : "⚠ BTC"}
        </Text>
      </View>
    </View>
  );
}

// ─── Macro strip component ────────────────────────────────────────────────────
function MacroStrip({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [macroData, setMacroData] = useState<MacroQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMacro = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/market/macro`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return;
      const d = await r.json() as { data?: MacroQuote[] };
      if (d?.data?.length) setMacroData(d.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMacro();
    intervalRef.current = setInterval(fetchMacro, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMacro]);

  if (loading) {
    return (
      <View style={[macStyles.container, { borderBottomColor: colors.border }]}>
        <View style={macStyles.labelRow}>
          <Text style={[macStyles.label, { color: colors.primary }]}>MACRO</Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!macroData.length) return null;

  // Determine overall macro sentiment
  const bullCount = macroData.filter(m => m.inverse ? m.changePct < 0 : m.changePct >= 0).length;
  const sentiment = bullCount >= 5 ? "FAVORABLE" : bullCount >= 3 ? "NEUTRAL" : "ADVERSO";
  const sentColor = bullCount >= 5 ? colors.green : bullCount >= 3 ? "#ffd700" : colors.red;

  return (
    <View style={[macStyles.container, { borderBottomColor: colors.border }]}>
      <View style={macStyles.labelRow}>
        <Text style={[macStyles.label, { color: colors.primary }]}>MACRO</Text>
        <View style={[macStyles.sentBadge, { backgroundColor: sentColor + "15", borderColor: sentColor + "40" }]}>
          <Text style={[macStyles.sentText, { color: sentColor }]}>{sentiment}</Text>
        </View>
        <Text style={[macStyles.sublabel, { color: colors.mutedForeground }]}>vs BTC · Live</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={macStyles.scroll}>
        {macroData.map((m) => <MacroCard key={m.symbol} item={m} colors={colors} />)}
      </ScrollView>
    </View>
  );
}

const macStyles = StyleSheet.create({
  container: { paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  label: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  sublabel: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  sentBadge: { borderRadius: 3, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  sentText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  scroll: { paddingHorizontal: 16, gap: 8 },
  card: { width: 88, borderRadius: 8, borderWidth: 1, padding: 10, gap: 3 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shortName: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  liveDot: { width: 4, height: 4, borderRadius: 2 },
  value: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 2 },
  changeRow: { flexDirection: "row", alignItems: "center" },
  change: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  corrBadge: { borderRadius: 3, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  corrText: { fontSize: 8, fontFamily: "Inter_700Bold" },
});

// ─── Main Screener ────────────────────────────────────────────────────────────
export default function Screener() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { assets, isLoading, refresh } = useMarket();
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CryptoAsset | null>(null);

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const signalColor = (sig: string) => {
    const map: Record<string, string> = {
      BUY_STRONG: colors.green,
      BUY: "#80e5b0",
      NEUTRAL: colors.mutedForeground,
      SELL: "#ff7070",
      SELL_STRONG: colors.red,
    };
    return map[sig] ?? colors.mutedForeground;
  };

  const signalLabel = (sig: string) => {
    const map: Record<string, string> = {
      BUY_STRONG: "BUY FUERTE",
      BUY: "BUY",
      NEUTRAL: "NEUTRAL",
      SELL: "SELL",
      SELL_STRONG: "SELL FUERTE",
    };
    return map[sig] ?? "NEUTRAL";
  };

  const filtered = useMemo(() => {
    let list = assets;
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter((a) => a.symbol.includes(q) || a.name.toUpperCase().includes(q));
    }
    if (filter === "COMPRA") list = list.filter((a) => a.signal === "BUY" || a.signal === "BUY_STRONG");
    if (filter === "VENTA") list = list.filter((a) => a.signal === "SELL" || a.signal === "SELL_STRONG");
    if (filter === "FUERTES") list = list.filter((a) => a.signal === "BUY_STRONG" || a.signal === "SELL_STRONG");
    return list;
  }, [assets, filter, search]);

  const FILTERS: Filter[] = ["TODOS", "COMPRA", "VENTA", "FUERTES"];

  const renderItem = ({ item }: { item: CryptoAsset }) => {
    const color = signalColor(item.signal);
    const pos = item.change24h >= 0;
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.border }]}
        onPress={() => { Haptics.selectionAsync(); setSelected(item); }}
        activeOpacity={0.7}
      >
        <Text style={[styles.rank, { color: colors.mutedForeground }]}>#{item.rank}</Text>
        <View style={[styles.icon, { backgroundColor: color + "20", borderColor: color + "50" }]}>
          <Text style={[styles.iconText, { color }]}>{item.symbol.slice(0, 2)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>{item.symbol}</Text>
          <Text style={[styles.name, { color: colors.mutedForeground }]} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={[styles.price, { color: colors.foreground }]}>{fmtPrice(item.price)}</Text>
          <Text style={[styles.change, { color: pos ? colors.green : colors.red }]}>
            {pos ? "+" : ""}{item.change24h.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.psyBlock}>
          <View style={[styles.psyBarBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.psyBarFill, { width: `${item.psyScore}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[styles.psyScore, { color }]}>{item.psyScore}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = useMemo(() => (
    <>
      <MacroStrip colors={colors} />
      <View style={[styles.colHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.colText, { color: colors.mutedForeground, width: 28 }]}>#</Text>
        <Text style={[styles.colText, { color: colors.mutedForeground, flex: 1 }]}>CRYPTO</Text>
        <Text style={[styles.colText, { color: colors.mutedForeground, width: 80, textAlign: "right" }]}>PRECIO</Text>
        <Text style={[styles.colText, { color: colors.mutedForeground, width: 48, textAlign: "right" }]}>24H</Text>
        <Text style={[styles.colText, { color: colors.mutedForeground, width: 50, textAlign: "right" }]}>PSY</Text>
      </View>
    </>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerArea, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          <Text style={{ color: colors.primary }}>PSY</Text>SCREENER
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Top {assets.length} cryptos · PSY-ULT1
        </Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Buscar crypto..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="characters"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, { borderColor: filter === f ? colors.primary : colors.border, backgroundColor: filter === f ? colors.primary + "20" : "transparent" }]}
              onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.mutedForeground }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); refresh(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sin resultados</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {selected && (
              <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalSymbol, { color: colors.foreground }]}>{selected.symbol}</Text>
                    <Text style={[styles.modalName, { color: colors.mutedForeground }]}>{selected.name}</Text>
                  </View>
                  <View style={[styles.signalBadge, { borderColor: signalColor(selected.signal) + "60", backgroundColor: signalColor(selected.signal) + "20" }]}>
                    <Text style={[styles.signalBadgeText, { color: signalColor(selected.signal) }]}>{signalLabel(selected.signal)}</Text>
                  </View>
                </View>
                <Text style={[styles.modalPrice, { color: colors.foreground }]}>{fmtPrice(selected.price)}</Text>
                <View style={styles.modalStats}>
                  {[
                    { label: "1H", value: `${selected.change1h >= 0 ? "+" : ""}${selected.change1h.toFixed(2)}%`, color: selected.change1h >= 0 ? colors.green : colors.red },
                    { label: "24H", value: `${selected.change24h >= 0 ? "+" : ""}${selected.change24h.toFixed(2)}%`, color: selected.change24h >= 0 ? colors.green : colors.red },
                    { label: "7D", value: `${selected.change7d >= 0 ? "+" : ""}${selected.change7d.toFixed(2)}%`, color: selected.change7d >= 0 ? colors.green : colors.red },
                  ].map((s) => (
                    <View key={s.label} style={[styles.modalStatCell, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.modalStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                      <Text style={[styles.modalStatValue, { color: s.color }]}>{s.value}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.psySection}>
                  <Text style={[styles.psyLabel, { color: colors.mutedForeground }]}>PSY SCORE</Text>
                  <View style={[styles.psyBarBgLarge, { backgroundColor: colors.muted }]}>
                    <View style={[styles.psyBarFill, { width: `${selected.psyScore}%` as any, backgroundColor: signalColor(selected.signal) }]} />
                  </View>
                  <Text style={[styles.psyLargeScore, { color: signalColor(selected.signal) }]}>{selected.psyScore}/100</Text>
                </View>

                {/* Real TA indicators — shown when signals server data is available */}
                {selected.rsi1h != null && (
                  <View style={[styles.taSection, { borderColor: colors.border, backgroundColor: colors.muted + "80" }]}>
                    <Text style={[styles.taTitle, { color: colors.primary }]}>ANÁLISIS TÉCNICO REAL</Text>
                    <View style={styles.taGrid}>
                      <View style={styles.taCell}>
                        <Text style={[styles.taCellLabel, { color: colors.mutedForeground }]}>RSI 1H</Text>
                        <Text style={[styles.taCellValue, {
                          color: selected.rsi1h < 35 ? colors.green : selected.rsi1h > 65 ? colors.red : "#ffd700"
                        }]}>{selected.rsi1h}</Text>
                      </View>
                      {selected.rsi4h != null && (
                        <View style={styles.taCell}>
                          <Text style={[styles.taCellLabel, { color: colors.mutedForeground }]}>RSI 4H</Text>
                          <Text style={[styles.taCellValue, {
                            color: selected.rsi4h < 35 ? colors.green : selected.rsi4h > 65 ? colors.red : "#ffd700"
                          }]}>{selected.rsi4h}</Text>
                        </View>
                      )}
                      {selected.htfBias && (
                        <View style={styles.taCell}>
                          <Text style={[styles.taCellLabel, { color: colors.mutedForeground }]}>BIAS 4H</Text>
                          <Text style={[styles.taCellValue, {
                            color: selected.htfBias === "BULLISH" ? colors.green : selected.htfBias === "BEARISH" ? colors.red : colors.mutedForeground
                          }]}>{selected.htfBias === "BULLISH" ? "▲ BULL" : selected.htfBias === "BEARISH" ? "▼ BEAR" : "— NEU"}</Text>
                        </View>
                      )}
                      {selected.macdHistogram != null && (
                        <View style={styles.taCell}>
                          <Text style={[styles.taCellLabel, { color: colors.mutedForeground }]}>MACD</Text>
                          <Text style={[styles.taCellValue, { color: selected.macdHistogram > 0 ? colors.green : colors.red }]}>
                            {selected.macdHistogram > 0 ? "▲ POS" : "▼ NEG"}
                          </Text>
                        </View>
                      )}
                      {selected.volumeSpike != null && (
                        <View style={styles.taCell}>
                          <Text style={[styles.taCellLabel, { color: colors.mutedForeground }]}>VOL SPIKE</Text>
                          <Text style={[styles.taCellValue, { color: (selected.volumeSpike ?? 0) > 2 ? colors.primary : colors.mutedForeground }]}>
                            ×{selected.volumeSpike?.toFixed(1)}
                          </Text>
                        </View>
                      )}
                      {selected.struct1h && (
                        <View style={styles.taCell}>
                          <Text style={[styles.taCellLabel, { color: colors.mutedForeground }]}>ESTR 1H</Text>
                          <Text style={[styles.taCellValue, {
                            color: selected.struct1h === "BULLISH" ? colors.green : selected.struct1h === "BEARISH" ? colors.red : colors.mutedForeground
                          }]}>{selected.struct1h === "BULLISH" ? "HH/HL" : selected.struct1h === "BEARISH" ? "LH/LL" : "— NEU"}</Text>
                        </View>
                      )}
                    </View>
                    {selected.taIndicators && selected.taIndicators.length > 0 && (
                      <View style={styles.taIndicatorsList}>
                        {selected.taIndicators.slice(0, 4).map((ind, idx) => (
                          <View key={idx} style={[styles.taIndicatorChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.taIndicatorText, { color: colors.mutedForeground }]}>{ind}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity style={[styles.closeBtn, { borderColor: colors.border }]} onPress={() => setSelected(null)}>
                  <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>CERRAR</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  filterBtn: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  filterText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  colHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, paddingHorizontal: 16 },
  colText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  rank: { fontSize: 10, fontFamily: "Inter_400Regular", width: 22 },
  icon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  info: { flex: 1 },
  symbol: { fontSize: 13, fontFamily: "Inter_700Bold" },
  name: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 1 },
  priceBlock: { width: 80, alignItems: "flex-end" },
  price: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  change: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  psyBlock: { width: 50, alignItems: "flex-end", gap: 3 },
  psyBarBg: { width: "100%", height: 3, borderRadius: 2, overflow: "hidden" },
  psyBarFill: { height: "100%", borderRadius: 2 },
  psyScore: { fontSize: 11, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  modalSymbol: { fontSize: 24, fontFamily: "Inter_700Bold" },
  modalName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  signalBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  signalBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  modalPrice: { fontSize: 32, fontFamily: "Inter_700Bold", marginBottom: 16 },
  modalStats: { flexDirection: "row", gap: 8, marginBottom: 20 },
  modalStatCell: { flex: 1, borderRadius: 6, padding: 10, alignItems: "center" },
  modalStatLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  modalStatValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  psySection: { marginBottom: 20 },
  psyLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8 },
  psyBarBgLarge: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  psyLargeScore: { fontSize: 22, fontFamily: "Inter_700Bold" },
  closeBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  closeBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  taSection: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 16, gap: 10 },
  taTitle: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  taGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  taCell: { minWidth: 60, alignItems: "center", gap: 2 },
  taCellLabel: { fontSize: 7, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  taCellValue: { fontSize: 11, fontFamily: "Inter_700Bold" },
  taIndicatorsList: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  taIndicatorChip: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  taIndicatorText: { fontSize: 8, fontFamily: "Inter_400Regular" },
});
