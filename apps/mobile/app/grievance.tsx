import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export default function GrievanceScreen() {
  const [category, setCategory] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);

  const create = async () => {
    setLoading(true);
    try {
      await apiRequest("/grievances", {
        method: "POST",
        body: JSON.stringify({ category, subject, description }),
      });
      setCategory(""); setSubject(""); setDescription("");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    const r = await apiRequest("/grievances");
    setItems(r.items ?? []);
  };

  React.useEffect(() => { load(); }, []);

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grievance Desk</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Category" />
      <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject" />
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" />
      <TouchableOpacity style={styles.createBtn} onPress={create} disabled={loading}>
        <Text style={styles.createBtnText}>{loading ? "Submitting..." : "Create ticket"}</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>My tickets</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.subject}</Text>
            <Text style={[styles.cardStatus, { color: item.status === "resolved" ? theme.colors.success : theme.colors.textMuted }]}>{item.status}</Text>
            <Text style={styles.cardReason}>{item.category}</Text>
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
  createBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.radius.md, alignItems: "center", marginBottom: 16 },
  createBtnText: { color: "#FFFFFF", fontWeight: "700" },
  subtitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginTop: 8 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  cardStatus: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  cardReason: { fontSize: 13, color: theme.colors.text, marginTop: 4 },
});
