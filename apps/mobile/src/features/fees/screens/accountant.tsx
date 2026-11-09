import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";
import { theme } from "@/src/lib/theme";

export default function AccountantFeesScreen() {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [payLoading, setPayLoading] = React.useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const r = await apiRequest(`/students?search=${encodeURIComponent(query)}&limit=10`);
      setResult(r.items?.[0] ?? null);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (amountPaise: number) => {
    setPayLoading(true);
    try {
      await pushOutbox("fees", { studentId: result.id, amountPaise, channel: "cash", idempotencyKey: "counter-" + Date.now() });
      await apiRequest("/payments", {
        method: "POST",
        body: JSON.stringify({ studentId: result.id, amountPaise, channel: "cash", idempotencyKey: "counter-" + Date.now() }),
      });
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Counter Collection</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search student name or admission number"
      />
      <TouchableOpacity style={styles.searchBtn} onPress={search}>
        <Text style={styles.searchBtnText}>Search</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      {result && (
        <View style={styles.card}>
          <Text style={styles.name}>{result.firstName} {result.lastName ?? ""}</Text>
          <Text style={styles.admission}>{result.admissionNumber}</Text>
          <TouchableOpacity style={styles.payBtn} onPress={() => recordPayment(10000)}>
            <Text style={styles.payBtnText}>Collect ₹100.00 (cash)</Text>
          </TouchableOpacity>
          {payLoading && <Text style={styles.paying}>Processing...</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 15, marginBottom: 12, color: theme.colors.text },
  searchBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center" },
  searchBtnText: { color: "#FFFFFF", fontWeight: "600" },
  card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginTop: 12 },
  name: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  admission: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 10 },
  payBtn: { backgroundColor: theme.colors.success, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center" },
  payBtnText: { color: "#FFFFFF", fontWeight: "600" },
  paying: { color: theme.colors.success, fontSize: 12, marginTop: 6 },
});
