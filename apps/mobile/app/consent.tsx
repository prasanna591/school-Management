import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSession } from "@/src/lib/session";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export default function ConsentScreen() {
  const { userId } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiRequest(`/consent-records?userId=${userId}`);
      setItems(r.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (id: string) => {
    await apiRequest(`/consent-records/${id}/withdraw`, { method: "POST" });
    await load();
  };

  React.useEffect(() => { load(); }, []);

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consent Management</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.purpose}</Text>
            <Text style={styles.cardMeta}>{new Date(item.givenAt).toLocaleDateString()}</Text>
            {!item.withdrawnAt && (
              <TouchableOpacity style={styles.withdrawBtn} onPress={() => withdraw(item.id)}>
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            )}
            {item.withdrawnAt && <Text style={styles.withdrawn}>Withdrawn</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 },
  withdrawBtn: { backgroundColor: theme.colors.error, paddingVertical: 8, borderRadius: theme.radius.md, alignItems: "center" },
  withdrawBtnText: { color: "#FFFFFF", fontWeight: "600" },
  withdrawn: { fontSize: 13, color: theme.colors.textMuted },
});
