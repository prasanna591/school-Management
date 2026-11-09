import { Dimensions, Platform } from "react-native";

export const theme = {
  colors: {
    primary: "#0F766E",
    primaryDark: "#115E59",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    success: "#15803D",
    warning: "#D97706",
    error: "#DC2626",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 10, lg: 16 },
  font: { body: Platform.OS === "ios" ? "System" : "sans-serif" },
  isSmallScreen: Dimensions.get("window").width < 360,
};
