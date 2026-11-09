import { Slot } from "expo-router";
import { useSync } from "@/src/lib/sync";

export default function RootLayout() {
  useSync();
  return <Slot />;
}
