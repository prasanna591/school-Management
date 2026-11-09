import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type Stat = { label: string; value: string | number; color: string };

export default function PrincipalDashboardScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["principal-dashboard"],
    queryFn: async () => apiRequest("/principal/dashboard"),
  });

  if (isLoading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.container}><Text style={styles.error}>{String(error)}</Text></View>;

  const d = data ?? {};
  const stats: Stat[] = [
    { label: "Students", value: d.totalStudents ?? 0, color: theme.colors.text },
    { label: "Attendance today", value: d.attendanceToday ?? 0, color: theme.colors.success },
    { label: "Fees collected today", value: `₹${((d.feesCollectedTodayPaise ?? 0) / 100).toFixed(2)}`, color: theme.colors.success },
    { label: "Pending approvals", value: d.pendingApprovals ?? 0, color: theme.colors.warning },
    { label: "Notices", value: d.totalNotices ?? 0, color: theme.colors.text },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Principal Dashboard</Text>
      <FlatList
        data={stats}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  loading: { color: theme.colors.textMuted },
  error: { color: theme.colors.error },
  statCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  statLabel: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
});
