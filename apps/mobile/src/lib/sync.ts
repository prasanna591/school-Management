import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { apiRequest } from "./api";
import { db } from "./db";

export const MAX_RETRIES = 5;

type OutboxRow = {
  id: string;
  entity: string;
  payload: string;
  created_at: string;
  retry_count: number;
};

const ENDPOINT_BY_ENTITY: Record<string, string> = {
  attendance: "/attendance/sessions/__sessionId__/mark",
  fees: "/payments",
  homework_submissions: "/homework-submissions",
  trip_points: "/trip-points",
  leave_requests: "/leave-requests",
};

const METHOD_BY_ENTITY: Record<string, "POST" | "PUT"> = {
  attendance: "POST",
  fees: "POST",
  homework_submissions: "POST",
  trip_points: "POST",
  leave_requests: "POST",
};

let isProcessing = false;

export async function processOutbox() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    const rows = await db.getAllAsync<OutboxRow>(
      `SELECT * FROM outbox ORDER BY created_at ASC LIMIT 50`
    );
    for (const row of rows) {
      const payload = JSON.parse(row.payload) as Record<string, unknown>;
      const idempotencyKey =
        (payload.idempotencyKey as string) ?? row.id;
      let endpoint: string = ENDPOINT_BY_ENTITY[row.entity];
      if (!endpoint) {
        await db.runAsync(`DELETE FROM outbox WHERE id = ?`, [row.id]);
        continue;
      }
      const body = { ...payload };
      delete body.idempotencyKey;
      if (row.entity === "attendance") {
        const sessionId = (payload.sessionId as string) ?? "";
        endpoint = endpoint.replace("__sessionId__", sessionId);
        delete body.sessionId;
      }
      try {
        await apiRequest(endpoint, {
          method: METHOD_BY_ENTITY[row.entity],
          body: JSON.stringify(body),
          headers: { "Idempotency-Key": idempotencyKey },
        });
        await db.runAsync(`DELETE FROM outbox WHERE id = ?`, [row.id]);
      } catch (err: any) {
        const retryCount = row.retry_count + 1;
        if (retryCount >= MAX_RETRIES) {
          await db.runAsync(`DELETE FROM outbox WHERE id = ?`, [row.id]);
        } else {
          await db.runAsync(
            `UPDATE outbox SET retry_count = ? WHERE id = ?`,
            [retryCount, row.id]
          );
        }
      }
    }
  } finally {
    isProcessing = false;
  }
}

export async function syncNow() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;
  await processOutbox();
}

export async function pullChanges(entity: string, since: string | null) {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { items: [], cursor: since };
  const url = `/sync/${entity}?since=${encodeURIComponent(since ?? "")}&limit=100`;
  const data = await apiRequest(url);
  return {
    items: data.items ?? [],
    cursor: data.nextCursor ?? since,
    hasMore: data.hasMore ?? false,
  };
}

export function useSync(onConnected?: () => void) {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void syncNow();
        onConnected?.();
      }
    });

    let appState: AppStateStatus = AppState.currentState;
    const handleAppStateChange = (next: AppStateStatus) => {
      if (
        appState.match(/inactive|background/) &&
        next === "active"
      ) {
        void syncNow();
      }
      appState = next;
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [onConnected]);
}
