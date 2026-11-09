import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE } from "@smartschool/shared";

type IconButtonProps = {
  onPress: () => void;
  icon: React.ReactNode;
  label?: string;
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
};

export function IconButton({
  onPress,
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
}: IconButtonProps) {
  const sizes = { sm: 36, md: 44 };
  const bg =
    variant === "danger"
      ? LIGHT_THEME.danger.light
      : variant === "primary"
      ? LIGHT_THEME.primary
      : "transparent";

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.container,
        size === "sm" && styles.sm,
        { backgroundColor: bg, minHeight: sizes[size], minWidth: sizes[size] },
      ]}
      activeOpacity={0.7}
    >
      {icon}
      {label && (
        <Text
          style={[
            styles.label,
            { fontSize: FONT_SIZE.caption, color: disabled ? "#9CA3AF" : LIGHT_THEME.text },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xs,
  },
  sm: { paddingHorizontal: SPACING.xs },
  label: {
    marginTop: 2,
    textAlign: "center",
  },
});
