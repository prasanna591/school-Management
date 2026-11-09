import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAttendance, STATUS_LABELS, STATUS_COLORS } from "@/src/features/attendance";
import { theme } from "@/src/lib/theme";

type Student = { id: string; admissionNumber: string; firstName: string; lastName: string | null };

export default function TeacherAttendanceScreen() {
  const { students, isLoading, marks, markMutation, createSession } = useAttendance();
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  if (isLoading) return <ActivityIndicator size="large" color={theme.colors.primary} />;
  const studentList: Student[] = students?.items ?? [];

  const create = async () => {
    const today = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const s = await createSession("demo-class", today);
    setSessionId(s.id);
  };

  const mark = (student: Student, status: "present" | "absent") => {
    if (!sessionId) return;
    markMutation.mutate({ sessionId, studentId: student.id, status });
  };

  const isAllPresent = studentList.every((s) => marks[s.id] === "present");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        {!sessionId && (
          <TouchableOpacity style={styles.createBtn} onPress={create}>
            <Text style={styles.createBtnText}>Start session</Text>
          </TouchableOpacity>
        )}
      </View>
      {sessionId && (
        <>
          <View style={styles.quick}>
            <TouchableOpacity
              style={[styles.pill, isAllPresent && styles.active]}
              onPress={() => studentList.forEach((s) => mark(s, "present"))}
            >
              <Text style={styles.pillText}>All present</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={studentList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const status = marks[item.id] ?? "present";
              return (
                <TouchableOpacity
                  style={[styles.row, status !== "present" && styles.marked]}
                  onPress={() => mark(item, status === "present" ? "absent" : "present")}
                >
                  <Text style={styles.name}>{item.firstName} {item.lastName ?? ""}</Text>
                  <Text style={[styles.status, { color: STATUS_COLORS[status] }]}>
                    {STATUS_LABELS[status]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  createBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.md },
  createBtnText: { color: "#FFFFFF", fontWeight: "600" },
  quick: { padding: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  active: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  marked: { backgroundColor: theme.colors.surface },
  name: { fontSize: 15, color: theme.colors.text, flex: 1 },
  status: { fontSize: 13, fontWeight: "600" },
});
