import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half day",
  "medical-leave": "Medical leave",
  "approved-leave": "Approved leave",
};

type AttendanceRecord = { id: string; studentId: string; status: string; markedAt: string };

export default function ParentAttendanceScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["attendance-records"],
    queryFn: async () => apiRequest("/attendance/sessions/demo-session/records"),
  });

  if (isLoading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.container}><Text style={styles.error}>{String(error)}</Text></View>;

  const records: AttendanceRecord[] = data?.items ?? [];

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const total = records.length;
  const pct = total ? Math.round((present / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <View style={styles.summary}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pct}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.studentId}>{item.studentId}</Text>
            <Text style={[styles.status, { color: theme.colors.error }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  loading: { color: theme.colors.textMuted },
  error: { color: theme.colors.error },
  summary: { flexDirection: "row", gap: 12, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  statLabel: { fontSize: 12, color: theme.colors.textMuted },
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: "row", justifyContent: "space-between" },
  studentId: { fontSize: 14, color: theme.colors.text },
  status: { fontSize: 14, fontWeight: "600" },
});
