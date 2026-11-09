import React from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";
import { theme } from "@/src/lib/theme";

type StudentMark = { id: string; firstName: string; lastName: string | null; marksObtained: number | null };

export default function TeacherMarksScreen() {
  const [maxMarks, setMaxMarks] = React.useState("100");
  const [marks, setMarks] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState<StudentMark[]>([]);
  const [examId, setExamId] = React.useState<string | null>(null);

  const load = async () => {
    const [sRes, eRes] = await Promise.all([
      apiRequest("/students?limit=100"),
      apiRequest("/exams"),
    ]);
    setStudents(sRes.items ?? []);
    const exams = eRes.items ?? [];
    if (exams.length) setExamId(exams[0].id);
  };

  React.useEffect(() => { load(); }, []);

  const save = async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const updates = Object.entries(marks).map(async ([studentId, m]) => {
        await pushOutbox("marks", { examId, studentId, marksObtained: m });
        await apiRequest("/marks", {
          method: "POST",
          body: JSON.stringify({ examId, studentId, marksObtained: m }),
        });
      });
      await Promise.all(updates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marks Entry</Text>
        <TextInput style={styles.maxInput} value={maxMarks} onChangeText={setMaxMarks} placeholder="Max marks" keyboardType="numeric" />
      </View>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const value = marks[item.id] ?? 0;
          return (
            <View style={styles.row} key={item.id}>
              <Text style={styles.name}>{item.firstName} {item.lastName ?? ""}</Text>
              <TextInput
                style={styles.markInput}
                value={String(value)}
                onChangeText={(t) => setMarks({ ...marks, [item.id]: Math.max(0, Math.min(Number(maxMarks), Number(t || 0))) })}
                keyboardType="numeric"
              />
            </View>
          );
        }}
      />
      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save marks"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  maxInput: { width: 80, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 6, fontSize: 14, color: theme.colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  name: { fontSize: 14, color: theme.colors.text },
  markInput: { width: 70, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 6, fontSize: 14, color: theme.colors.text },
  saveBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.radius.md, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
