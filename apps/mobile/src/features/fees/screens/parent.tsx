import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSession } from "@/src/lib/session";
import { useFees, formatRupees } from "@/src/features/fees";
import { theme } from "@/src/lib/theme";

type Charge = { id: string; type: string; amountPaise: number; description: string | null; occurredAt: string };

export default function ParentFeesScreen() {
  const { userId } = useSession();
  const { dues, isLoading, payMutation } = useFees(userId || "");

  if (isLoading) return <ActivityIndicator size="large" color={theme.colors.primary} />;
  if (!dues) return null;

  const charges: Charge[] = dues.charges ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.label}>Total charged</Text>
        <Text style={styles.value}>{formatRupees(dues.totalChargedPaise)}</Text>
        <Text style={styles.label}>Total paid</Text>
        <Text style={styles.value}>{formatRupees(dues.totalPaidPaise)}</Text>
        <Text style={styles.label}>Balance due</Text>
        <Text style={styles.balance}>{formatRupees(dues.balancePaise)}</Text>
      </View>
      <TouchableOpacity style={styles.payBtn} onPress={() => payMutation.mutate({ amountPaise: dues.balancePaise, channel: "upi", idempotencyKey: "pay-" + Date.now() })}>
        <Text style={styles.payBtnText}>Pay ₹{((dues.balancePaise / 100) || 0).toFixed(2)}</Text>
      </TouchableOpacity>
      <FlatList
        data={charges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.chargeRow}>
            <View>
              <Text style={styles.chargeName}>{item.description || item.type}</Text>
              <Text style={styles.chargeDate}>{new Date(item.occurredAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.chargeAmount}>{formatRupees(item.amountPaise)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  summary: { gap: 8, marginBottom: 16 },
  label: { fontSize: 12, color: theme.colors.textMuted },
  value: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  balance: { fontSize: 20, fontWeight: "700", color: theme.colors.error },
  payBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.radius.md, alignItems: "center", marginBottom: 16 },
  payBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  chargeRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  chargeName: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  chargeDate: { fontSize: 12, color: theme.colors.textMuted },
  chargeAmount: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
});
