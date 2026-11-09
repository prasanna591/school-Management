import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";
import { theme } from "@/src/lib/theme";

export default function DriverTransportScreen() {
  const [trips, setTrips] = React.useState<any[]>([]);
  const [activeTrip, setActiveTrip] = React.useState<any>(null);

  const load = async () => {
    const [r] = await Promise.all([apiRequest("/trips")]);
    const items = r.items ?? [];
    setTrips(items);
    setActiveTrip(items.find((t: any) => t.status === "started") ?? null);
  };

  React.useEffect(() => { load(); }, []);

  const startTrip = async (tripId: string) => {
    try {
      await apiRequest(`/trips/${tripId}/start`, { method: "POST" });
      await load();
    } catch {
      // handled by UI
    }
  };

  const endTrip = async (tripId: string) => {
    try {
      await apiRequest(`/trips/${tripId}/end`, { method: "POST" });
      await load();
    } catch {
      // handled by UI
    }
  };

  const sendPoint = async (lat: string, lng: string) => {
    if (!activeTrip) return;
    await pushOutbox("trip_points", { tripId: activeTrip.id, latitude: lat, longitude: lng });
    try {
      await apiRequest("/trip-points", {
        method: "POST",
        body: JSON.stringify({ tripId: activeTrip.id, latitude: lat, longitude: lng }),
      });
    } catch {
      // offline: queued
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transport - Driver</Text>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Route {item.routeId}</Text>
            <Text style={styles.cardStatus}>{item.status}</Text>
            <View style={styles.actions}>
              {item.status === "scheduled" && (
                <TouchableOpacity style={styles.btn} onPress={() => startTrip(item.id)}>
                  <Text style={styles.btnText}>Start trip</Text>
                </TouchableOpacity>
              )}
              {item.status === "started" && (
                <>
                  <TouchableOpacity style={styles.btn} onPress={() => endTrip(item.id)}>
                    <Text style={styles.btnText}>End trip</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      />
      {activeTrip && (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Active Trip</Text>
          <TouchableOpacity style={styles.sendPoint} onPress={() => sendPoint("12.9716", "77.5946")}>
            <Text style={styles.sendPointText}>Send GPS point</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  cardStatus: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center" },
  btnText: { color: "#FFFFFF", fontWeight: "600" },
  activeCard: { backgroundColor: "#FFF3E0", padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.warning, marginTop: 12 },
  activeTitle: { fontSize: 14, fontWeight: "700", color: "#D97706", marginBottom: 8 },
  sendPoint: { backgroundColor: theme.colors.warning, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "center" },
  sendPointText: { color: "#FFFFFF", fontWeight: "600" },
});
