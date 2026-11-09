import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimetableScreen() {
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    apiRequest("/timetable?classId=demo-class").then((r) => setItems(r.items ?? []));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timetable</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardDay}>{DAYS[item.dayOfWeek] ?? item.dayOfWeek}</Text>
              <Text style={styles.cardPeriod}>Period {item.period}</Text>
            </View>
            <Text style={styles.cardSubject}>{item.subjectId ? "Subject" : "—"}</Text>
            {item.room && <Text style={styles.cardRoom}>{item.room}</Text>}
            {item.teacherId && <Text style={styles.cardTeacher}>Teacher assigned</Text>}
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
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cardDay: { fontSize: 15, fontWeight: "700", color: theme.colors.primary },
  cardPeriod: { fontSize: 13, color: theme.colors.textMuted },
  cardSubject: { fontSize: 14, color: theme.colors.text, marginBottom: 4 },
  cardRoom: { fontSize: 13, color: theme.colors.textMuted },
  cardTeacher: { fontSize: 13, color: theme.colors.success },
});
