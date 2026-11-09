import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "@/src/lib/theme";

type Child = { id: string; name: string; class: string };

type Props = { children: Child[]; onSelect: (id: string) => void; selectedId: string };

export function ChildSwitcher({ children, onSelect, selectedId }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Child</Text>
      <View style={styles.list}>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            onPress={() => onSelect(child.id)}
            style={[styles.pill, selectedId === child.id && styles.active]}
          >
            <Text style={[styles.text, selectedId === child.id && styles.activeText]}>
              {child.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  label: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 },
  list: { flexDirection: "row", gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  active: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  text: { fontSize: 13, color: theme.colors.text },
  activeText: { color: "#FFFFFF", fontWeight: "600" },
});
