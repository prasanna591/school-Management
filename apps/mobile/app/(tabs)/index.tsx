import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { useSession } from "@/src/lib/session";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";
import { ChildSwitcher } from "@/src/components/ChildSwitcher";

type ChildSummary = {
  id: string;
  name: string;
  class: string;
  attendanceToday: "present" | "absent" | "late";
  hasHomework: boolean;
  unpaidDues: boolean;
};

const demoChildren: ChildSummary[] = [
  { id: "c1", name: "Arav S.", class: "5A", attendanceToday: "present", hasHomework: true, unpaidDues: true },
  { id: "c2", name: "Meera S.", class: "3B", attendanceToday: "absent", hasHomework: false, unpaidDues: false },
];

export default function TodayScreen() {
  const { role } = useSession();
  const [selectedChildId, setSelectedChildId] = React.useState<string>(demoChildren[0]?.id ?? "");

  const selectedChild = demoChildren.find((c) => c.id === selectedChildId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("today")}</Text>
        <Text style={styles.subtitle}>{role}</Text>
      </View>
      <ChildSwitcher children={demoChildren} onSelect={setSelectedChildId} selectedId={selectedChildId} />
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName}>{selectedChild?.name ?? "—"}</Text>
          <Text style={styles.cardClass}>{selectedChild?.class ?? "—"}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={selectedChild?.attendanceToday === "present" ? styles.present : styles.absent}>
            {selectedChild?.attendanceToday === "present" ? "Present today" : "Absent today"}
          </Text>
        </View>
        <View style={styles.actions}>
          {selectedChild?.hasHomework && <Text style={styles.pill}>Homework due</Text>}
          {selectedChild?.unpaidDues && <Text style={styles.pillDue}>Unpaid dues</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginHorizontal: 16, marginVertical: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  cardName: { fontSize: 18, fontWeight: "600", color: theme.colors.text },
  cardClass: { fontSize: 14, color: theme.colors.textMuted },
  present: { fontSize: 14, color: theme.colors.success },
  absent: { fontSize: 14, color: theme.colors.error },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  pill: { fontSize: 12, color: theme.colors.warning, fontWeight: "600" },
  pillDue: { fontSize: 12, color: theme.colors.error, fontWeight: "600" },
});
