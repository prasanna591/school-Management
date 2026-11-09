import { StyleSheet, TouchableOpacity, Text } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT } from "@smartschool/shared";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: any;
};

const variantStyles = {
  primary: {
    background: LIGHT_THEME.success.base,
    text: "#FFFFFF",
    borderColor: "transparent",
  },
  secondary: {
    background: LIGHT_THEME.surface,
    text: LIGHT_THEME.text,
    borderColor: LIGHT_THEME.border,
  },
  outline: {
    background: "transparent",
    text: LIGHT_THEME.primary,
    borderColor: LIGHT_THEME.primary,
  },
  ghost: {
    background: "transparent",
    text: LIGHT_THEME.textMuted,
    borderColor: "transparent",
  },
} as const;

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const vs = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: isDisabled ? LIGHT_THEME.textMuted : vs.background,
          borderColor: vs.borderColor,
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <Text style={styles.spinnerText}>⟳</Text>
      ) : (
        <Text
          style={[
            styles.text,
            { color: isDisabled ? "#9CA3AF" : vs.text, fontWeight: FONT_WEIGHT.semibold },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
  },
  fullWidth: { width: "100%" },
  text: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.normal,
  },
  spinnerText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
