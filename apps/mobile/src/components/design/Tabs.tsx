import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LIGHT_THEME, SPACING, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type TabsProps = {
  activeIndex: number;
  onChange: (index: number) => void;
  labels: string[];
};

export function Tabs({ activeIndex, onChange, labels }: TabsProps) {
  return (
    <View style={styles.container}>
      {labels.map((label, i) => (
        <TouchableOpacity
          key={label}
          onPress={() => onChange(i)}
          style={[
            styles.tab,
            i === activeIndex && styles.active,
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, i === activeIndex && styles.activeText]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_THEME.border,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  active: {
    borderBottomWidth: 2,
    borderBottomColor: LIGHT_THEME.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
    color: LIGHT_THEME.textMuted,
  },
  activeText: {
    color: LIGHT_THEME.primary,
  },
});
