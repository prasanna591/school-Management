import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, NEUTRAL } from "@smartschool/shared";

type BadgeProps = {
  children: React.ReactNode | string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
};

const variantStyles = {
  success: { bg: LIGHT_THEME.success.light, color: LIGHT_THEME.success.dark },
  warning: { bg: LIGHT_THEME.warning.light, color: LIGHT_THEME.warning.dark },
  danger: { bg: LIGHT_THEME.danger.light, color: LIGHT_THEME.danger.dark },
  info: { bg: LIGHT_THEME.info.light, color: LIGHT_THEME.info.dark },
  neutral: { bg: NEUTRAL[200], color: NEUTRAL[700] },
} as const;

export function Badge({ children, variant = "neutral", size = "sm" }: BadgeProps) {
  const vs = variantStyles[variant];
  const fontSize = size === "sm" ? FONT_SIZE.caption : FONT_SIZE.body;
  const padding = size === "sm" ? { px: SPACING.xs, py: 2 } : { px: SPACING.sm, py: 4 };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: vs.bg, paddingHorizontal: padding.px, paddingVertical: padding.py },
      ]}
    >
      <Text style={[styles.text, { color: vs.color, fontSize, fontWeight: FONT_WEIGHT.semibold }]}>
        {children}
      </Text>
    </View>
  );
}

type StatusPillProps = {
  status: string;
  size?: "sm" | "md";
};

const statusMap: Record<string, keyof typeof variantStyles> = {
  present: "success",
  absent: "danger",
  late: "warning",
  approved: "success",
  rejected: "danger",
  pending: "warning",
  resolved: "success",
  open: "warning",
  closed: "neutral",
  active: "success",
  issued: "success",
} as const;

export function StatusPill({ status, size = "sm" }: StatusPillProps) {
  const variant = statusMap[status.toLowerCase()] ?? "neutral";
  return <Badge variant={variant} size={size}>{status}</Badge>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.sm,
  },
  text: {
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: "center",
  },
});
