import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSession } from "@/src/lib/session";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";
import { theme } from "@/src/lib/theme";

export default function ParentHomeworkScreen() {
  const { userId } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [homeworks, setHomeworks] = React.useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiRequest("/homeworks");
      setHomeworks(r.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (homeworkId: string) => {
    setLoading(true);
    try {
      await pushOutbox("homework_submissions", { homeworkId, studentId: userId, textAnswer: "submitted" });
      await apiRequest("/homework-submissions", {
        method: "POST",
        body: JSON.stringify({ homeworkId, studentId: userId, textAnswer: "submitted" }),
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Homework</Text>
      <FlatList
        data={homeworks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubject}>{item.subject}</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => submit(item.id)}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  cardSubject: { fontSize: 13, color: theme.colors.textMuted },
  submitBtn: { backgroundColor: theme.colors.primary, paddingVertical: 8, borderRadius: theme.radius.md, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#FFFFFF", fontWeight: "600" },
});
