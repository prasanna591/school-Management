import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";
import { theme } from "@/src/lib/theme";

export default function TeacherHomeworkScreen() {
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [homeworks, setHomeworks] = React.useState<any[]>([]);

  const post = async () => {
    setLoading(true);
    try {
      await pushOutbox("homeworks", { classId: "demo-class", subject, title, description });
      await apiRequest("/homeworks", {
        method: "POST",
        body: JSON.stringify({ classId: "demo-class", subject, title, description }),
      });
      setTitle(""); setSubject(""); setDescription("");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    const r = await apiRequest("/homeworks?classId=demo-class");
    setHomeworks(r.items ?? []);
  };

  React.useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Homework</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
      <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject" />
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" />
      <TouchableOpacity style={styles.postBtn} onPress={post} disabled={loading}>
        <Text style={styles.postBtnText}>{loading ? "Posting..." : "Post homework"}</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>My homeworks</Text>
      <FlatList
        data={homeworks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubject}>{item.subject}</Text>
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
  postBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.radius.md, alignItems: "center", marginBottom: 16 },
  postBtnText: { color: "#FFFFFF", fontWeight: "700" },
  subtitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginTop: 8 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  cardSubject: { fontSize: 13, color: theme.colors.textMuted },
});
