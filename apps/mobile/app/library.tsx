import React from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { apiRequest } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type Book = { id: string; title: string; author: string | null; barcode: string | null; availableCopies: number; totalCopies: number };

export default function LibraryScreen() {
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [books, setBooks] = React.useState<Book[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const url = search ? `/library/books?search=${encodeURIComponent(search)}` : "/library/books";
      const r = await apiRequest(url);
      setBooks(r.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, [search]);

  const issueBook = async (book: Book) => {
    if (!book.availableCopies) return;
    setLoading(true);
    try {
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await apiRequest("/library/issues", {
        method: "POST",
        body: JSON.stringify({ bookId: book.id, studentId: "demo-student", dueDate }),
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Search books by title"
      />
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardAuthor}>{item.author ?? "Unknown author"}</Text>
              {item.barcode && <Text style={styles.cardBarcode}>Barcode: {item.barcode}</Text>}
            </View>
            <View style={styles.actions}>
              <Text style={styles.available}>
                {item.availableCopies} / {item.totalCopies} available
              </Text>
              {item.availableCopies > 0 ? (
                <TouchableOpacity style={styles.issueBtn} onPress={() => issueBook(item)}>
                  <Text style={styles.issueBtnText}>Issue</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.unavailable}>Unavailable</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, fontSize: 15, marginBottom: 12, color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text, marginBottom: 2 },
  cardAuthor: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 },
  cardBarcode: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  available: { fontSize: 13, fontWeight: "600", color: theme.colors.success },
  unavailable: { fontSize: 13, fontWeight: "600", color: theme.colors.error },
  issueBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.sm },
  issueBtnText: { color: "#FFFFFF", fontWeight: "600" },
});
