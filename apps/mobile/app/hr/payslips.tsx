import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

const formatRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

type Payslip = { id: string; payslipNumber: string; basicPaise: number; allowancesPaise: number; deductionsPaise: number; netPaise: number; status: string; createdAt: string };

export default function PayslipsScreen() {
  const [items, setItems] = React.useState<Payslip[]>([]);

  React.useEffect(() => {
    apiRequest("/payslips").then((r) => setItems(r.items ?? []));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payslips</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardNumber}>{item.payslipNumber}</Text>
              <Text style={styles.cardNet}>{formatRupees(item.netPaise)}</Text>
            </View>
            <View style={styles.breakdown}>
              <Text style={styles.breakItem}>Basic {formatRupees(item.basicPaise)}</Text>
              <Text style={styles.breakItem}>Allowances {formatRupees(item.allowancesPaise)}</Text>
              <Text style={styles.breakItem}>Deductions {formatRupees(item.deductionsPaise)}</Text>
            </View>
            <Text style={[styles.cardStatus, { color: item.status === "issued" ? theme.colors.success : theme.colors.textMuted }]}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardNumber: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  cardNet: { fontSize: 16, fontWeight: "700", color: theme.colors.success },
  breakdown: { flexDirection: "row", gap: 10, marginBottom: 6 },
  breakItem: { fontSize: 12, color: theme.colors.textMuted },
  cardStatus: { fontSize: 12, fontWeight: "600", marginTop: 4 },
});
