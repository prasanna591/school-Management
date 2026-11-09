import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import {
  Button,
  Card,
  CardBody,
  Badge,
  StatusPill,
  Avatar,
  ListItem,
  StatCard,
  Skeleton,
  SkeletonText,
  EmptyState,
  ErrorState,
  Field,
  Sheet,
  Tabs,
  Toast,
} from "@/src/components/design";
import { LIGHT_THEME, DARK_THEME, SPACING } from "@smartschool/shared";

const TAML_LABELS = {
  title: "வடிவம் Gallery",
  subtitle: "அனைத்து கூறுகளும் — தமிழ் & ஆங்கிலம், வெளிச்சம் & இருட்",
  button: "போன்டன்",
  card: "கார்டு",
  badge: "க insignia",
  listItem: "பட்டியல் உருஉ",
  stat: "எண்",
  skeleton: "சூழல்",
  empty: "ஏதுமில்லை",
  error: "பிழை",
  field: "உள்ளீடு புல்",
  sheet: "ஒوبا",
  tabs: "கட்டுகள்",
  toast: "சোটீ",
  toggleLang: "English",
  toggleTheme: "ஒளிமode",
};

export default function DesignGallery() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [lang, setLang] = React.useState<"en" | "ta">("en");
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [toast, setToast] = React.useState<{
    show: boolean;
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  const theme = darkMode ? DARK_THEME : LIGHT_THEME;

  const labels = {
    en: {
      title: "Design Gallery",
      subtitle: "All components — English & Tamil, light & dark",
      button: "Button",
      card: "Card",
      badge: "Badge",
      listItem: "List Item",
      stat: "Stat Card",
      skeleton: "Skeleton",
      empty: "Empty State",
      error: "Error State",
      field: "Input Field",
      sheet: "Sheet",
      tabs: "Tabs",
      toast: "Show Toast",
      toggleLang: "தமிழ்",
      toggleTheme: "Dark Mode",
    },
    ta: TAML_LABELS,
  };

  const L = labels[lang];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{L.title}</Text>
        <View style={styles.toggles}>
          <Text style={[styles.toggleLabel, { color: theme.textMuted }]}>
            {L.toggleLang}
          </Text>
          <Switch
            value={lang === "ta"}
            onValueChange={(v) => setLang(v ? "ta" : "en")}
            trackColor={{ false: LIGHT_THEME.border, true: LIGHT_THEME.primary }}
          />
          <Text style={[styles.toggleLabel, { color: theme.textMuted }]}>
            {L.toggleTheme}
          </Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: LIGHT_THEME.border, true: LIGHT_THEME.primary }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Buttons</Text>
        <View style={styles.row}>
          <Button title={L.button} variant="primary" onPress={() => {}} />
          <Button title={L.button} variant="secondary" onPress={() => {}} disabled />
          <Button title={L.button} variant="outline" onPress={() => {}} />
          <Button title={L.button} variant="ghost" onPress={() => {}} />
          <Button title={L.button} variant="primary" loading onPress={() => {}} />
        </View>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Cards & Stats</Text>
        <View style={styles.row}>
          <Card style={styles.cardItem}>
            <CardBody>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {L.card}
              </Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                Card content area
              </Text>
            </CardBody>
          </Card>
          <StatCard
            label="Students"
            value="120"
            sublabel="+5 this week"
            trend="up"
            trendValue="+4%"
          />
          <StatCard
            label="Fees Collected"
            value="₹45,000"
            sublabel="This month"
            trend="down"
            trendValue="-2%"
          />
        </View>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Badges & Status</Text>
        <View style={styles.row}>
          <Badge variant="success">Present</Badge>
          <Badge variant="danger">Absent</Badge>
          <Badge variant="warning">Late</Badge>
          <Badge variant="info">Medical</Badge>
          <Badge variant="neutral">Approved</Badge>
          <StatusPill status="present" />
          <StatusPill status="absent" />
          <StatusPill status="pending" />
        </View>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Avatar & List</Text>
        <View style={styles.row}>
          <Avatar name="Arav Sharma" size="md" />
          <Avatar name="Meera Sharma" size="md" />
          <ListItem
            leading={<Avatar name="Rajesh" size="sm" />}
            title="Arav S."
            subtitle="Class 5A • Present today"
            trailing={<Badge variant="success">Present</Badge>}
          />
          <ListItem
            leading={<Avatar name="Sita" size="sm" />}
            title="Fee Due"
            subtitle="₹12,000 • Due in 3 days"
            trailing={<Badge variant="danger">Overdue</Badge>}
          />
        </View>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Inputs</Text>
        <Field
          label={L.field}
          placeholder="Enter text"
          value=""
          onChangeText={() => {}}
        />
        <Field
          label="Error input"
          placeholder="Invalid"
          value=""
          onChangeText={() => {}}
          error="This field is required"
        />

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>States</Text>
        <View style={styles.row}>
          <EmptyState
            title={L.empty}
            subtitle="No students found for this class."
            actionLabel="Refresh"
            onAction={() => {}}
          />
          <ErrorState
            title={L.error}
            subtitle="Unable to load fees. Please check your connection."
            onRetry={() => {}}
          />
          <Skeleton width="full" height={100} />
          <SkeletonText lines={3} lastLineWidth="full" />
        </View>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Navigation</Text>
        <Tabs activeIndex={tabIndex} onChange={setTabIndex} labels={["Today", "Fees", "Academics"]} />
        <View style={styles.tabContent}>
          {tabIndex === 0 && (
            <Text style={[styles.tabTextInner, { color: theme.textMuted }]}>
              Today view content
            </Text>
          )}
          {tabIndex === 1 && (
            <Text style={[styles.tabTextInner, { color: theme.textMuted }]}>
              Fees view content
            </Text>
          )}
          {tabIndex === 2 && (
            <Text style={[styles.tabTextInner, { color: theme.textMuted }]}>
              Academics view content
            </Text>
          )}
        </View>

        <View style={[styles.divider, { borderColor: theme.border }]} />

        <Button
          title={L.toast}
          variant="primary"
          onPress={() => {
            setToast({
              show: true,
              type: "success",
              message: "Fee payment received successfully",
            });
            setTimeout(() => setToast(null), 4000);
          }}
        />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
            undoLabel="Undo"
            onUndo={() => setToast(null)}
          />
        )}

        <Button title={L.sheet} variant="outline" onPress={() => setSheetVisible(true)} />
        <Sheet visible={sheetVisible} onClose={() => setSheetVisible(false)} title="Sheet Header">
          <Text style={[styles.sheetText, { color: theme.text }]}>
            Sheet content area with actions and details.
          </Text>
        </Sheet>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: { fontSize: 24, fontWeight: "700" },
  toggles: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  toggleLabel: {
    fontSize: 14,
    color: LIGHT_THEME.textMuted,
    marginRight: SPACING.xs,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: LIGHT_THEME.border,
    marginVertical: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  cardItem: {
    flex: 1,
    minWidth: 140,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
  },
  tabContent: {
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  tabTextInner: {
    fontSize: 16,
    color: LIGHT_THEME.textMuted,
  },
  sheetText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
