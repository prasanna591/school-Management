import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, NEUTRAL } from "@smartschool/shared";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, { backgroundColor: LIGHT_THEME.background }]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.title, { color: LIGHT_THEME.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: LIGHT_THEME.textMuted }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={styles.action}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: NEUTRAL[100],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.bold,
    color: LIGHT_THEME.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZE.body,
    color: LIGHT_THEME.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  action: {
    backgroundColor: LIGHT_THEME.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },
});
