import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LIGHT_THEME, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from "@smartschool/shared";

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
        <View style={styles.close} />
      </TouchableOpacity>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LIGHT_THEME.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.bold,
    color: LIGHT_THEME.text,
  },
  close: { position: "absolute", top: SPACING.md, right: SPACING.md },
  closeText: {
    fontSize: 20,
    color: LIGHT_THEME.textMuted,
  },
  content: { flex: 1 },
});
