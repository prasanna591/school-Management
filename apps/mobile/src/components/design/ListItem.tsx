import { StyleSheet, Pressable, Text, View } from "react-native";
import { LIGHT_THEME, SPACING, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type ListItemProps = {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  disabled = false,
}: ListItemProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
      android_ripple={{ color: LIGHT_THEME.border }}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_THEME.border,
  },
  disabled: { opacity: 0.5 },
  leading: { marginRight: SPACING.sm },
  body: { flex: 1 },
  title: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: LIGHT_THEME.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.caption,
    color: LIGHT_THEME.textMuted,
    marginTop: 2,
  },
  trailing: { marginLeft: SPACING.sm },
});
