import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSession } from "@/src/lib/session";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";

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
];

export default function TodayScreen() {
  const { role } = useSession();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("today")}</Text>
        <Text style={styles.subtitle}>{role}</Text>
      </View>
      <FlatList
        data={demoChildren}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardClass}>{item.class}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={item.attendanceToday === "present" ? styles.present : styles.absent}>
                {item.attendanceToday === "present" ? "Present today" : "Absent today"}
              </Text>
            </View>
            <View style={styles.actions}>
              {item.hasHomework && <Text style={styles.pill}>Homework due</Text>}
              {item.unpaidDues && <Text style={styles.pillDue}>Unpaid dues</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: "700", color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: theme.colors.border },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  cardName: { fontSize: 18, fontWeight: "600", color: theme.colors.text },
  cardClass: { fontSize: 14, color: theme.colors.textMuted },
  present: { fontSize: 14, color: theme.colors.success },
  absent: { fontSize: 14, color: theme.colors.error },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  pill: { fontSize: 12, color: theme.colors.warning, fontWeight: "600" },
  pillDue: { fontSize: 12, color: theme.colors.error, fontWeight: "600" },
});
