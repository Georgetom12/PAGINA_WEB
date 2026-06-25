import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Direction, Emotion, JournalEntry, TradeResult, useJournal } from "@/context/JournalContext";

const EMOTIONS: { key: Emotion; label: string; icon: string }[] = [
  { key: "FOMO", label: "FOMO", icon: "zap" },
  { key: "MIEDO", label: "Miedo", icon: "alert-triangle" },
  { key: "CONFIANZA", label: "Confianza", icon: "shield" },
  { key: "NEUTRO", label: "Neutro", icon: "minus-circle" },
  { key: "EUFORIA", label: "Euforia", icon: "star" },
];

const emotionColor = (e: Emotion, green: string, red: string, gold: string, mut: string, primary: string) => {
  const map: Record<Emotion, string> = { FOMO: red, MIEDO: "#ff7070", CONFIANZA: green, NEUTRO: mut, EUFORIA: gold };
  return map[e] ?? mut;
};

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const colors = useColors();
  const isWin = entry.result === "WIN";
  const isOpen = entry.result === "OPEN";
  const resultColor = isOpen ? colors.gold : isWin ? colors.green : colors.red;
  const dirColor = entry.direction === "LONG" ? colors.green : colors.red;
  const eColor = emotionColor(entry.emotion, colors.green, colors.red, colors.gold, colors.mutedForeground, colors.primary);

  return (
    <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.entryHeader}>
        <View style={styles.entryLeft}>
          <Text style={[styles.entryCrypto, { color: colors.foreground }]}>{entry.crypto}</Text>
          <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>{entry.date}</Text>
        </View>
        <View style={styles.entryBadges}>
          <View style={[styles.badge, { backgroundColor: dirColor + "20", borderColor: dirColor + "50" }]}>
            <Text style={[styles.badgeText, { color: dirColor }]}>{entry.direction}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: resultColor + "20", borderColor: resultColor + "50" }]}>
            <Text style={[styles.badgeText, { color: resultColor }]}>{entry.result}</Text>
          </View>
        </View>
      </View>
      {entry.pnlPercent !== undefined && (
        <Text style={[styles.entryPnl, { color: entry.pnlPercent >= 0 ? colors.green : colors.red }]}>
          {entry.pnlPercent >= 0 ? "+" : ""}{entry.pnlPercent.toFixed(2)}% PnL
        </Text>
      )}
      <View style={styles.emotionRow}>
        <Feather name={EMOTIONS.find((e) => e.key === entry.emotion)?.icon as any ?? "circle"} size={12} color={eColor} />
        <Text style={[styles.emotionText, { color: eColor }]}>{entry.emotion}</Text>
        {entry.notes ? <Text style={[styles.notesPreview, { color: colors.mutedForeground }]} numberOfLines={1}>· {entry.notes}</Text> : null}
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}>
        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

type FormState = { crypto: string; direction: Direction; result: TradeResult; entry: string; exit: string; pnl: string; emotion: Emotion; notes: string };
const EMPTY_FORM: FormState = { crypto: "", direction: "LONG", result: "OPEN", entry: "", exit: "", pnl: "", emotion: "NEUTRO", notes: "" };

export default function Journal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, addEntry, deleteEntry, winRate, totalPnl } = useJournal();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isIOS ? 50 + insets.bottom : isWeb ? 84 : 0;
  const topPad = isWeb ? 67 : insets.top;

  const handleSave = async () => {
    if (!form.crypto.trim()) return;
    setSaving(true);
    await addEntry({
      crypto: form.crypto.trim().toUpperCase(),
      direction: form.direction,
      result: form.result,
      entry: parseFloat(form.entry) || 0,
      exit: form.exit ? parseFloat(form.exit) : undefined,
      pnlPercent: form.pnl ? parseFloat(form.pnl) : undefined,
      emotion: form.emotion,
      notes: form.notes.trim(),
    });
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerArea, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          <Text style={{ color: colors.primary }}>PSY</Text>JOURNAL
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Diario de trading</Text>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>OPERACIONES</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{entries.length}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>WIN RATE</Text>
            <Text style={[styles.statValue, { color: winRate >= 50 ? colors.green : colors.red }]}>{winRate}%</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>P&L TOTAL</Text>
            <Text style={[styles.statValue, { color: totalPnl >= 0 ? colors.green : colors.red }]}>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryCard entry={item} onDelete={() => deleteEntry(item.id)} />}
        contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 80, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="book-open" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>Sin entradas aún</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Registra tu primera operación</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 16 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(true); }}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalBg}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>NUEVA OPERACIÓN</Text>
                <TouchableOpacity onPress={() => { setShowModal(false); setForm(EMPTY_FORM); }}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Crypto */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CRYPTO</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="BTC, ETH, SOL..."
                  placeholderTextColor={colors.mutedForeground}
                  value={form.crypto}
                  onChangeText={(v) => setForm({ ...form, crypto: v })}
                  autoCapitalize="characters"
                />

                {/* Direction */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DIRECCIÓN</Text>
                <View style={styles.toggleRow}>
                  {(["LONG", "SHORT"] as Direction[]).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.toggleBtn, { borderColor: form.direction === d ? (d === "LONG" ? colors.green : colors.red) : colors.border, backgroundColor: form.direction === d ? (d === "LONG" ? colors.green + "20" : colors.red + "20") : "transparent", flex: 1 }]}
                      onPress={() => { Haptics.selectionAsync(); setForm({ ...form, direction: d }); }}
                    >
                      <Feather name={d === "LONG" ? "trending-up" : "trending-down"} size={14} color={form.direction === d ? (d === "LONG" ? colors.green : colors.red) : colors.mutedForeground} />
                      <Text style={[styles.toggleText, { color: form.direction === d ? (d === "LONG" ? colors.green : colors.red) : colors.mutedForeground }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Result */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>RESULTADO</Text>
                <View style={styles.toggleRow}>
                  {(["WIN", "LOSS", "OPEN"] as TradeResult[]).map((r) => {
                    const rColor = r === "WIN" ? colors.green : r === "LOSS" ? colors.red : colors.gold;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.toggleBtn, { borderColor: form.result === r ? rColor : colors.border, backgroundColor: form.result === r ? rColor + "20" : "transparent", flex: 1 }]}
                        onPress={() => { Haptics.selectionAsync(); setForm({ ...form, result: r }); }}
                      >
                        <Text style={[styles.toggleText, { color: form.result === r ? rColor : colors.mutedForeground }]}>{r}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* PnL */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PnL (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Ej: +5.2 o -3.1"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.pnl}
                  onChangeText={(v) => setForm({ ...form, pnl: v })}
                  keyboardType="numeric"
                />

                {/* Emotion */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EMOCIÓN</Text>
                <View style={styles.emotionGrid}>
                  {EMOTIONS.map((e) => {
                    const eColor = emotionColor(e.key, colors.green, colors.red, colors.gold, colors.mutedForeground, colors.primary);
                    const selected = form.emotion === e.key;
                    return (
                      <TouchableOpacity
                        key={e.key}
                        style={[styles.emotionBtn, { borderColor: selected ? eColor : colors.border, backgroundColor: selected ? eColor + "20" : "transparent" }]}
                        onPress={() => { Haptics.selectionAsync(); setForm({ ...form, emotion: e.key }); }}
                      >
                        <Feather name={e.icon as any} size={14} color={selected ? eColor : colors.mutedForeground} />
                        <Text style={[styles.emotionBtnText, { color: selected ? eColor : colors.mutedForeground }]}>{e.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Notes */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTAS</Text>
                <TextInput
                  style={[styles.inputMulti, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="¿Qué aprendiste de esta operación?"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.notes}
                  onChangeText={(v) => setForm({ ...form, notes: v })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: form.crypto.trim() ? colors.primary : colors.muted }]}
                  onPress={handleSave}
                  disabled={saving || !form.crypto.trim()}
                >
                  <Text style={[styles.saveBtnText, { color: form.crypto.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                    {saving ? "GUARDANDO..." : "GUARDAR OPERACIÓN"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 6, borderWidth: 1, padding: 10, alignItems: "center" },
  statLabel: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  entryCard: { borderRadius: 8, borderWidth: 1, padding: 14 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  entryLeft: { gap: 2 },
  entryCrypto: { fontSize: 16, fontFamily: "Inter_700Bold" },
  entryDate: { fontSize: 10, fontFamily: "Inter_400Regular" },
  entryBadges: { flexDirection: "row", gap: 6 },
  badge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  entryPnl: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6 },
  emotionRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  emotionText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  notesPreview: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1 },
  deleteBtn: { position: "absolute", top: 14, right: 14 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  fab: { position: "absolute", right: 20, width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  fieldLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 6, marginTop: 14 },
  input: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputMulti: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 6, borderWidth: 1, paddingVertical: 10 },
  toggleText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  emotionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emotionBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  emotionBtnText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  saveBtn: { borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 20, marginBottom: 10 },
  saveBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
});
