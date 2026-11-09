import { StyleSheet, View, Text } from "react-native";
import { LIGHT_THEME, FONT_WEIGHT } from "@smartschool/shared";

type AvatarProps = {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
  style?: any;
};

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

export function Avatar({ name, photoUrl, size = "md", style }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const diameter = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
        style,
      ]}
    >
      {photoUrl ? (
        <View style={styles.imageWrap}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIGHT_THEME.border,
  },
  imageWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: LIGHT_THEME.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.bold,
    color: "#FFFFFF",
  },
});
