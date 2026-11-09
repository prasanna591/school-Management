import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSession } from "@/src/lib/session";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type ReportItem = { examId: string; examName: string; subject: string; term: string; marksObtained: number; maxMarks: number; status: string };

export default function ParentReportCardScreen() {
  const { userId } = useSession();
  const [items, setItems] = React.useState<ReportItem[]>([]);

  React.useEffect(() => {
    apiRequest(`/students/${userId}/report-card`).then((r) => setItems(r.items ?? []));
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Card</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.examId + item.subject}
        renderItem={({ item }) => {
          const pct = item.maxMarks ? Math.round((item.marksObtained / item.maxMarks) * 100) : 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{item.examName}</Text>
                <Text style={styles.cardTerm}>{item.term}</Text>
              </View>
              <Text style={styles.cardSubject}>{item.subject}</Text>
              <View style={styles.markRow}>
                <Text style={styles.markValue}>{item.marksObtained} / {item.maxMarks}</Text>
                <Text style={styles.markPct}>{pct}%</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  cardTerm: { fontSize: 13, color: theme.colors.textMuted },
  cardSubject: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 8 },
  markRow: { flexDirection: "row", justifyContent: "space-between" },
  markValue: { fontSize: 18, fontWeight: "700", color: theme.colors.text },
  markPct: { fontSize: 14, fontWeight: "600", color: theme.colors.primary },
});
