import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="fees" options={{ title: "Fees" }} />
      <Tabs.Screen name="academics" options={{ title: "Academics" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
