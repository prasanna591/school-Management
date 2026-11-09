import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export default function AdmissionsScreen() {
  const [childName, setChildName] = React.useState("");
  const [parentName, setParentName] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [source, setSource] = React.useState("walkin");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const create = async () => {
    setLoading(true);
    try {
      await apiRequest("/admissions", {
        method: "POST",
        body: JSON.stringify({ childName, parentName, parentPhone, source }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admissions Enquiry</Text>
      <TextInput style={styles.input} value={childName} onChangeText={setChildName} placeholder="Child name" />
      <TextInput style={styles.input} value={parentName} onChangeText={setParentName} placeholder="Parent name" />
      <TextInput style={styles.input} value={parentPhone} onChangeText={setParentPhone} placeholder="Parent phone" keyboardType="numeric" />
      <Text style={styles.label}>Source</Text>
      <View style={styles.sourceRow}>
        {["walkin", "phone", "whatsapp", "qr", "web"].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sourceBtn, source === s && styles.sourceActive]}
            onPress={() => setSource(s)}
          >
            <Text style={[styles.sourceText, source === s && styles.sourceActiveText]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={create} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? "Submitting..." : "Submit enquiry"}</Text>
      </TouchableOpacity>
      {submitted && <Text style={styles.success}>Enquiry submitted successfully</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 15, marginBottom: 12, color: theme.colors.text },
  label: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 },
  sourceRow: { flexDirection: "row", gap: 6, marginBottom: 16, flexWrap: "wrap" },
  sourceBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border },
  sourceActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sourceText: { fontSize: 12, color: theme.colors.text },
  sourceActiveText: { color: "#FFFFFF", fontWeight: "600" },
  submitBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: "center" },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700" },
  success: { color: theme.colors.success, fontWeight: "600", marginTop: 12 },
});
