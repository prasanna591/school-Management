import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type ErrorStateProps = {
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
};

export function ErrorState({
  title,
  subtitle,
  onRetry,
  retryLabel = "Try again",
  icon,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
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
    backgroundColor: LIGHT_THEME.danger.light,
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
  retry: {
    backgroundColor: LIGHT_THEME.danger.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.body,
  },
});
