import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSession } from "@/src/lib/session";
import { useFees, formatRupees } from "@/src/features/fees";
import { theme } from "@/src/lib/theme";
import { OfflineBanner } from "@/src/components/design";

type Charge = { id: string; type: string; amountPaise: number; description: string | null; occurredAt: string };

export default function ParentFeesScreen() {
  const { userId } = useSession();
  const { dues, isLoading, payMutation } = useFees(userId || "");

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  if (!dues) return null;

  const charges: Charge[] = dues.charges ?? [];

  const payAll = () => {
    payMutation.mutate({
      amountPaise: dues.balancePaise,
      channel: "upi",
      idempotencyKey: "pay-" + Date.now(),
    });
  };

  return (
      <View style={styles.container}>
        <OfflineBanner />

        <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Fee Summary</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Charged</Text>
          <Text style={styles.amountValue}>{formatRupees(dues.totalChargedPaise)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Paid</Text>
          <Text style={styles.amountValue}>{formatRupees(dues.totalPaidPaise)}</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance Due</Text>
          <Text style={styles.balanceValue}>{formatRupees(dues.balancePaise)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={payAll}>
        <Text style={styles.payBtnText}>
          Pay {formatRupees(dues.balancePaise)}
        </Text>
      </TouchableOpacity>

      <View style={styles.chargesSection}>
        <Text style={styles.sectionTitle}>Itemised Charges</Text>
        <FlatList
          data={charges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.chargeRow}>
              <View>
                <Text style={styles.chargeName}>{item.description || item.type}</Text>
                <Text style={styles.chargeDate}>
                  {new Date(item.occurredAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.chargeAmount}>{formatRupees(item.amountPaise)}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  summaryCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  amountValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "600",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.error,
  },
  payBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    marginBottom: 16,
  },
  payBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  chargesSection: {
    paddingHorizontal: 16,
  },
  chargeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chargeName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  chargeDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  chargeAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
