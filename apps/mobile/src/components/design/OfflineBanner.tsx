import { View, Text, StyleSheet } from "react-native";
import { LIGHT_THEME, SPACING, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type OfflineBannerProps = {
  message?: string;
}

export function OfflineBanner({ message = "You are offline. Changes will sync when reconnected." }: OfflineBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Text style={styles.icon}>📴</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3CD",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_THEME.border,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZE.body,
    color: "#856404",
    fontWeight: FONT_WEIGHT.medium,
  },
});
