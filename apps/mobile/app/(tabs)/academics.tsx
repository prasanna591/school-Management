import { View, Text, StyleSheet } from "react-native";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";

export default function AcademicsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("academics")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
});
