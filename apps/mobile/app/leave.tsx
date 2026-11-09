import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export default function LeaveScreen() {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);

  const apply = async () => {
    setLoading(true);
    try {
      await apiRequest("/leave-requests", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      setStartDate(""); setEndDate(""); setReason("");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    const r = await apiRequest("/leave-requests");
    setItems(r.items ?? []);
  };

  React.useEffect(() => { load(); }, []);

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apply for Leave</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="Start date (YYYY-MM-DD)" />
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="End date (YYYY-MM-DD)" />
      <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Reason" />
      <TouchableOpacity style={styles.applyBtn} onPress={apply} disabled={loading}>
        <Text style={styles.applyBtnText}>{loading ? "Submitting..." : "Apply"}</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>My leave requests</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</Text>
            <Text style={[styles.cardStatus, { color: item.status === "approved" ? theme.colors.success : theme.colors.textMuted }]}>{item.status}</Text>
            <Text style={styles.cardReason}>{item.reason}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 15, marginBottom: 10, color: theme.colors.text },
  applyBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.radius.md, alignItems: "center", marginBottom: 16 },
  applyBtnText: { color: "#FFFFFF", fontWeight: "700" },
  subtitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginTop: 8 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  cardStatus: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  cardReason: { fontSize: 13, color: theme.colors.text, marginTop: 4 },
});
