import { Dimensions, Platform } from "react-native";
import { LIGHT_THEME } from "@smartschool/shared";

export const theme = {
  colors: {
    primary: LIGHT_THEME.primary,
    primaryDark: LIGHT_THEME.primaryDark,
    background: LIGHT_THEME.background,
    surface: LIGHT_THEME.surface,
    text: LIGHT_THEME.text,
    textMuted: LIGHT_THEME.textMuted,
    border: LIGHT_THEME.border,
    success: LIGHT_THEME.success.base,
    warning: LIGHT_THEME.warning.base,
    error: LIGHT_THEME.danger.base,
  },
  spacing: LIGHT_THEME.spacing,
  radius: LIGHT_THEME.radius,
  font: {
    body: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  isSmallScreen: Dimensions.get("window").width < 360,
};
