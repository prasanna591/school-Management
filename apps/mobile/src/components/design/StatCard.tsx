import { StyleSheet, View, Text } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
};

export function StatCard({
  label,
  value,
  sublabel,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        {trend && trendValue && (
          <Text style={[styles.trendText, { color: trendColor(trend) }]}>
            {trendValue}
          </Text>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
    </View>
  );
}

function trendColor(t: "up" | "down" | "neutral") {
  return t === "up" ? LIGHT_THEME.success.base : t === "down" ? LIGHT_THEME.danger.base : LIGHT_THEME.textMuted;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIGHT_THEME.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: LIGHT_THEME.border,
    padding: SPACING.md,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.caption,
    color: LIGHT_THEME.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  trendText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  value: {
    fontSize: FONT_SIZE.headingLg,
    fontWeight: FONT_WEIGHT.bold,
    color: LIGHT_THEME.text,
    marginBottom: SPACING.xs,
  },
  sublabel: {
    fontSize: FONT_SIZE.caption,
    color: LIGHT_THEME.textMuted,
  },
});
