import { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { useSession } from "@/src/lib/session";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";

export default function SchoolCodeScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setSession } = useSession();

  const resolve = async () => {
    setLoading(true);
    setError("");
    try {
      const tenant = await apiRequest(`/tenants/resolve?code=${encodeURIComponent(code)}`);
      setSession(tenant.id, "parent", ""); // role set after login
      return tenant;
    } catch (e: any) {
      setError(e.message || t("tenantNotFound"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("welcome")}</Text>
      <Text style={styles.hint}>{t("schoolCode")}</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="e.g. demo-school"
        autoCapitalize="none"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Button title="Continue" onPress={resolve} color={theme.colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 28, fontWeight: "700", color: theme.colors.text, marginBottom: 8 },
  hint: { fontSize: 16, color: theme.colors.textMuted, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 16, marginBottom: 16, color: theme.colors.text },
  error: { color: theme.colors.error, fontSize: 14, marginBottom: 12 },
});
