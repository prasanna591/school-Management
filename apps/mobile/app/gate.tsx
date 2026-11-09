import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export default function GateScreen() {
  const [qr, setQr] = React.useState("");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const r = await apiRequest(`/gate-passes/${qr}/verify`, { method: "POST" });
      setResult(r);
    } catch (e: any) {
      setResult({ error: e.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gate - QR Verify</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={qr}
          onChangeText={setQr}
          placeholder="Scan or enter QR code"
        />
        <TouchableOpacity style={styles.verifyBtn} onPress={verify} disabled={loading}>
          <Text style={styles.verifyBtnText}>{loading ? "Verifying..." : "Verify"}</Text>
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultCard}>
          <Text style={[styles.resultTitle, { color: result.error ? theme.colors.error : theme.colors.success }]}>
            {result.error ? "Invalid pass" : "Pass verified"}
          </Text>
          <Text style={styles.resultMeta}>{result.guardianName || ""}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  inputWrap: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 15, color: theme.colors.text },
  verifyBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: theme.radius.md, alignItems: "center" },
  verifyBtnText: { color: "#FFFFFF", fontWeight: "700" },
  resultCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  resultTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  resultMeta: { fontSize: 13, color: theme.colors.textMuted },
});
