import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

export default function ParentTransportScreen() {
  const [trip, setTrip] = React.useState<any>(null);
  const [points, setPoints] = React.useState<any[]>([]);

  React.useEffect(() => {
    apiRequest("/trips").then((r) => {
      const active = (r.items ?? []).find((t: any) => t.status === "started");
      setTrip(active);
      if (active) {
        apiRequest(`/trips/${active.id}/points`).then((pr) => setPoints(pr.items ?? []));
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bus Tracking</Text>
      {trip ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip active</Text>
          <Text style={styles.cardStatus}>Route {trip.routeId}</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>Live map (last {points.length} points)</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noTrip}>No active trip</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 6 },
  cardStatus: { fontSize: 14, color: theme.colors.textMuted },
  mapPlaceholder: { height: 200, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginTop: 12, alignItems: "center", justifyContent: "center" },
  mapText: { fontSize: 13, color: theme.colors.textMuted },
  noTrip: { fontSize: 15, color: theme.colors.textMuted },
});
