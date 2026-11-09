import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type Notice = { id: string; title: string; body: string | null; audience: string; createdAt: string };

export default function NoticesScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => apiRequest("/notices"),
  });

  if (isLoading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.container}><Text style={styles.error}>{String(error)}</Text></View>;

  const notices: Notice[] = data?.items ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notices</Text>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.titleText}>{item.title}</Text>
            {item.body && <Text style={styles.body}>{item.body}</Text>}
            <Text style={styles.meta}>{item.audience} · {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
  loading: { color: theme.colors.textMuted },
  error: { color: theme.colors.error },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  titleText: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  body: { fontSize: 14, color: theme.colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 6 },
});
