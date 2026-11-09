import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { setToken } from "@/src/lib/api";
import { useSession } from "@/src/lib/session";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setSession } = useSession();

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await apiRequest("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone }) });
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });
      await setToken(data.accessToken);
      setSession(data.user.tenantId, data.user.role, data.user.id);
    } catch (e: any) {
      setError(e.message || t("invalidOtp"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("welcome")}</Text>
      {step === "phone" ? (
        <>
          <Text style={styles.label}>Mobile number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="numeric" />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title={t("sendingOtp") || "Send OTP"} onPress={sendOtp} color={theme.colors.primary} disabled={loading} />
        </>
      ) : (
        <>
          <Text style={styles.label}>{t("enterOtp")}</Text>
          <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="123456" keyboardType="numeric" maxLength={6} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title={t("verifying") || "Verify"} onPress={verifyOtp} color={theme.colors.primary} disabled={loading} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  title: { fontSize: 28, fontWeight: "700", color: theme.colors.text, marginBottom: 8 },
  label: { fontSize: 16, color: theme.colors.textMuted, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 16, marginBottom: 16, color: theme.colors.text },
  error: { color: theme.colors.error, fontSize: 14, marginBottom: 12 },
});
