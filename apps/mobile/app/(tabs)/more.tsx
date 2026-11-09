import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/src/lib/theme";

const items = [
  { label: "Apply for Leave", to: "/leave" },
  { label: "Grievance Desk", to: "/grievance" },
  { label: "Language", to: "/settings" },
  { label: "Log out", to: "/auth/login" },
];

export default function MoreScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>More</Text>
      {items.map((item) => (
        <TouchableOpacity key={item.label} style={styles.row} onPress={() => router.push(item.to)}>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  label: { fontSize: 15, color: theme.colors.text },
});
