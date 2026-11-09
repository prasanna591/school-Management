import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSession } from "@/src/lib/session";
import { t } from "@/src/lib/i18n";
import { theme } from "@/src/lib/theme";
import { ChildSwitcher } from "@/src/components/ChildSwitcher";
import { OfflineBanner } from "@/src/components/design";

type ChildSummary = {
  id: string;
  name: string;
  class: string;
  attendanceToday: "present" | "absent" | "late";
  hasHomework: boolean;
  unpaidDues: boolean;
};

const demoChildren: ChildSummary[] = [
  {
    id: "c1",
    name: "Arav S.",
    class: "5A",
    attendanceToday: "present",
    hasHomework: true,
    unpaidDues: true,
  },
  {
    id: "c2",
    name: "Meera S.",
    class: "3B",
    attendanceToday: "absent",
    hasHomework: false,
    unpaidDues: false,
  },
];

type TodayCard = {
  id: string;
  title: string;
  subtitle: string;
  value: string | number;
  color: "success" | "warning" | "error" | "info";
  icon: string;
  onPress: () => void;
};

const parentCards: TodayCard[] = [
  {
    id: "attendance",
    title: "Attendance Today",
    subtitle: "Arav S. - Class 5A",
    value: "Present",
    color: "success",
    icon: "\u2713",
    onPress: () => {},
  },
  {
    id: "dues",
    title: "Unpaid Dues",
    subtitle: "\u20B92,500 due by Friday",
    value: "\u20B92,500",
    color: "error",
    icon: "\u20B9",
    onPress: () => {},
  },
  {
    id: "homework",
    title: "Homework Due",
    subtitle: "Math - Due tomorrow",
    value: "1 assignment",
    color: "warning",
    icon: "\uD83D\uDCDD",
    onPress: () => {},
  },
  {
    id: "notices",
    title: "Latest Notices",
    subtitle: "3 unread notices",
    value: "3",
    color: "info",
    icon: "\uD83D\uDCE2",
    onPress: () => {},
  },
];

const teacherCards: TodayCard[] = [
  {
    id: "attendance",
    title: "Classes Needing Attendance",
    subtitle: "2 classes awaiting marking",
    value: "2",
    color: "warning",
    icon: "\uD83D\uDCCB",
    onPress: () => {},
  },
  {
    id: "marks",
    title: "Pending Marks Entry",
    subtitle: "Math - Class 5A",
    value: "24 students",
    color: "info",
    icon: "\u270F\uFE0F",
    onPress: () => {},
  },
  {
    id: "leave",
    title: "Pending Leave Approvals",
    subtitle: "3 requests awaiting action",
    value: "3",
    color: "warning",
    icon: "\uD83D\uDCCB",
    onPress: () => {},
  },
  {
    id: "messages",
    title: "Unread Parent Messages",
    subtitle: "4 unread threads",
    value: "4",
    color: "info",
    icon: "\uD83D\uDCDB",
    onPress: () => {},
  },
];

const principalCards: TodayCard[] = [
  {
    id: "attendance",
    title: "Attendance Today",
    subtitle: "94% student attendance",
    value: "94%",
    color: "success",
    icon: "\uD83D\uDC65",
    onPress: () => {},
  },
  {
    id: "fees",
    title: "Fees Collected Today",
    subtitle: "\u20B945,000 collected",
    value: "\u20B945,000",
    color: "success",
    icon: "\u20B9",
    onPress: () => {},
  },
  {
    id: "dues",
    title: "Outstanding Dues",
    subtitle: "\u20B912,500 overdue",
    value: "\u20B912,500",
    color: "error",
    icon: "\u26A0",
    onPress: () => {},
  },
  {
    id: "alerts",
    title: "Open Alerts",
    subtitle: "3 chronic absence cases",
    value: "3",
    color: "warning",
    icon: "\uD83D\uDEA8",
    onPress: () => {},
  },
];

export default function TodayScreen() {
  const { role } = useSession();
  const [selectedChildId, setSelectedChildId] = React.useState<string>(
    demoChildren[0]?.id ?? ""
  );

  const selectedChild = demoChildren.find((c) => c.id === selectedChildId);

  let cards: TodayCard[] = [];
  if (role === "parent") cards = parentCards;
  else if (role === "teacher" || role === "class_teacher")
    cards = teacherCards;
  else cards = principalCards;

  if (!selectedChild) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("today")}</Text>
        <Text style={styles.subtitle}>{role}</Text>
      </View>

      <OfflineBanner />

      <ChildSwitcher
        children={demoChildren}
        onSelect={setSelectedChildId}
        selectedId={selectedChildId}
      />

      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>Today</Text>
      </View>

      <View style={styles.cardGrid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              card.color === "success" && styles.cardSuccess,
              card.color === "warning" && styles.cardWarning,
              card.color === "error" && styles.cardError,
              card.color === "info" && styles.cardInfo,
            ]}
            onPress={card.onPress}
          >
            <View style={styles.cardInner}>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cardColorMap = {
  success: {
    borderColor: theme.colors.success,
    backgroundColor: "#ECFDF5",
  },
  warning: {
    borderColor: theme.colors.warning,
    backgroundColor: "#FFFBEB",
  },
  error: {
    borderColor: theme.colors.error,
    backgroundColor: "#FEF2F2",
  },
  info: {
    borderColor: theme.colors.primary,
    backgroundColor: "#EFF6FF",
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 20, paddingTop: 50 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 110,
  },
  cardSuccess: cardColorMap.success,
  cardWarning: cardColorMap.warning,
  cardError: cardColorMap.error,
  cardInfo: cardColorMap.info,
  cardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
