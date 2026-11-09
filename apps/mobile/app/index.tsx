import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useSession } from "@/src/lib/session";
import { initI18n } from "@/src/lib/i18n";
import { initDb } from "@/src/lib/db";

export default function IndexScreen() {
  const router = useRouter();
  const { tenantId } = useSession();

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initI18n();
      await initDb();
      if (!mounted) return;
      if (tenantId) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth/school-code");
      }
    })();
    return () => { mounted = false; };
  }, [tenantId, router]);

  return null;
}
