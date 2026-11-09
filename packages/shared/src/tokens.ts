/**
 * SmartSchool design tokens — single source of truth.
 * Consumed by web (Tailwind config) and mobile (theme).
 */

export type ThemeMode = "light" | "dark";

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const MOTION = {
  fast: 150,
  normal: 200,
  slow: 250,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const FONT_FAMILY = {
  body:
    "Lohit Tamil, Namil, Mukta, Noto Sans Devanagari, sans-serif",
  heading:
    "Lohit Tamil, Namil, Mukta, Noto Sans Devanagari, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const FONT_SIZE = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  headingSm: 18,
  heading: 20,
  headingLg: 24,
  display: 32,
} as const;

export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const LINE_HEIGHT = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Neutral scale (slate)
export const NEUTRAL = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
} as const;

// Semantic colors
export const SEMANTIC = {
  success: { base: "#15803D", light: "#DCFCE7", dark: "#166534" },
  warning: { base: "#D97706", light: "#FEF3C7", dark: "#B45309" },
  danger: { base: "#DC2626", light: "#FEE2E2", dark: "#B91C1C" },
  info: { base: "#2563EB", light: "#DBEAFE", dark: "#1D4ED8" },
} as const;

// Tenant brand-derived palette factory
export function deriveBrandPalette(brandColor: string) {
  // brandColor is a hex like #0F766E
  return {
    brand: brandColor,
    brandHover: adjustHex(brandColor, -15),
    brandPressed: adjustHex(brandColor, -25),
    brandSubtle: adjustHex(brandColor, 85),
    brandOn: "#FFFFFF",
  };
}

function adjustHex(hex: string, pct: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + pct * 2.55));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + pct * 2.55));
  const b = Math.min(255, Math.max(0, (num & 255) + pct * 2.55));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Light theme tokens
export const LIGHT_THEME = {
  mode: "light" as ThemeMode,
  background: "#FFFFFF",
  surface: "#F9FAFB",
  surfaceElevated: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  inverse: "#FFFFFF",
  primary: "#0F766E",
  primaryDark: "#115E59",
  ...NEUTRAL,
  ...SEMANTIC,
  spacing: SPACING,
  radius: RADIUS,
  motion: MOTION,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
} as const;

// Dark theme tokens
export const DARK_THEME = {
  mode: "dark" as ThemeMode,
  background: "#0F172A",
  surface: "#1E293B",
  surfaceElevated: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  border: "#334155",
  inverse: "#0F172A",
  primary: "#10B981",
  primaryDark: "#34d399",
  ...NEUTRAL,
  ...SEMANTIC,
  spacing: SPACING,
  radius: RADIUS,
  motion: MOTION,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
} as const;

// Color-blind-safe chart palette
export const CHART_PALETTE = [
  "#0F766E",
  "#0891B2",
  "#7C3AED",
  "#DB2777",
  "#D97706",
  "#16A34A",
] as const;

export type TokenTheme = typeof LIGHT_THEME & typeof DARK_THEME;

export function getTheme(mode: ThemeMode, brandColor?: string): TokenTheme {
  const base = mode === "dark" ? DARK_THEME : LIGHT_THEME;
  if (!brandColor) return base as TokenTheme;
  const brand = deriveBrandPalette(brandColor);
  return { ...base, ...brand } as TokenTheme;
}
