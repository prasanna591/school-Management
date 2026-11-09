import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAttendance, STATUS_LABELS, STATUS_COLORS } from "@/src/features/attendance";
import { theme } from "@/src/lib/theme";

type Student = { id: string; admissionNumber: string; firstName: string; lastName: string | null };

export default function TeacherAttendanceScreen() {
  const { students, isLoading, marks, markMutation, createSession } = useAttendance();
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const studentList: Student[] = students?.items ?? [];

  const create = async () => {
    const today = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const s = await createSession("demo-class", today);
    setSessionId(s.id);
  };

  const mark = (student: Student, status: "present" | "absent" | "late") => {
    if (!sessionId) return;
    markMutation.mutate({ sessionId, studentId: student.id, status });
  };

  const isAllPresent = studentList.every((s) => marks[s.id] === "present");

  const submit = async () => {
    // Submit all marks - handled by outbox sync
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        {!sessionId && (
          <TouchableOpacity style={styles.createBtn} onPress={create}>
            <Text style={styles.createBtnText}>Start Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessionId && (
        <>
          <View style={styles.quickBar}>
            <TouchableOpacity
              style={[
                styles.pill,
                isAllPresent && styles.pillActive,
              ]}
              onPress={() => studentList.forEach((s) => mark(s, "present"))}
            >
              <Text style={styles.pillText}>All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={studentList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const status = marks[item.id] ?? "present";
              return (
                <TouchableOpacity
                  style={[
                    styles.studentRow,
                    status !== "present" && styles.rowMarked,
                  ]}
                  onPress={() =>
                    mark(
                      item,
                      status === "present" ? "absent" : "present"
                    )}
                  activeOpacity={0.95}
                >
                  <View style={styles.studentInfo}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {item.firstName[0]}{item.lastName?.[0] ?? ""}
                      </Text>
                    </View>
                    <View style={styles.studentName}>
                      <Text style={styles.studentNameText}>
                        {item.firstName} {item.lastName ?? ""}
                      </Text>
                      <Text style={styles.studentSub}>
                        {item.admissionNumber}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No students in this class</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  createBtnText: { color: "#FFFFFF", fontWeight: "600" },
  quickBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  pill: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
  },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700" },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowMarked: { backgroundColor: theme.colors.surface },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  studentName: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  studentSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
});
