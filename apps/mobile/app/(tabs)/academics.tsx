import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";

type Student = { id: string; admissionNumber: string; firstName: string; lastName: string | null };

export default function AcademicsScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["students"],
    queryFn: async () => apiRequest("/students?limit=50"),
  });

  if (isLoading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  if (error) return <View style={styles.container}><Text style={styles.error}>{String(error)}</Text></View>;

  const students: Student[] = data?.items ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("academics")}</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.firstName} {item.lastName ?? ""}</Text>
            <Text style={styles.admission}>{item.admissionNumber}</Text>
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
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  name: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  admission: { fontSize: 13, color: theme.colors.textMuted },
});
