import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onDismiss?: () => void;
  undoLabel?: string;
  onUndo?: () => void;
};

const variantStyles = {
  success: { bg: LIGHT_THEME.success.base, icon: "✓" },
  error: { bg: LIGHT_THEME.danger.base, icon: "✕" },
  info: { bg: LIGHT_THEME.info.base, icon: "ℹ" },
  warning: { bg: LIGHT_THEME.warning.base, icon: "⚠" },
} as const;

export function Toast({
  message,
  type = "info",
  onDismiss,
  undoLabel,
  onUndo,
}: ToastProps) {
  const vs = variantStyles[type];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bar,
          { backgroundColor: vs.bg },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{vs.icon}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={styles.actions}>
          {undoLabel && onUndo && (
            <TouchableOpacity
              onPress={onUndo}
              style={styles.undo}
              activeOpacity={0.7}
            >
              <Text style={styles.undoText}>{undoLabel}</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.dismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: SPACING.md,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minHeight: 44,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  icon: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  message: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
    color: "#FFFFFF",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  undo: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  undoText: {
    color: "#FFFFFF",
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  dismiss: {
    padding: 6,
  },
  dismissText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
