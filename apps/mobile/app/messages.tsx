import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type Thread = { id: string; title: string | null; participantIds: string[]; updatedAt: string };

export default function MessagesScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["message-threads"],
    queryFn: async () => apiRequest("/message-threads"),
  });

  if (isLoading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.container}><Text style={styles.error}>{String(error)}</Text></View>;

  const threads: Thread[] = data?.items ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.title || "Conversation"}</Text>
            <Text style={styles.time}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
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
  row: { flexDirection: "row", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  name: { fontSize: 15, fontWeight: "600", color: theme.colors.text },
  time: { fontSize: 13, color: theme.colors.textMuted },
});
