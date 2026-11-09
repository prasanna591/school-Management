import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";

export const useFees = (studentId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["fees-dues", studentId],
    queryFn: async () => apiRequest(`/students/${studentId}/dues`),
  });

  const payMutation = useMutation({
    mutationFn: async ({ amountPaise, channel, idempotencyKey }: { amountPaise: number; channel: string; idempotencyKey: string }) => {
      await pushOutbox("fees", { studentId, amountPaise, channel, idempotencyKey });
      try {
        await apiRequest("/payments", {
          method: "POST",
          body: JSON.stringify({ studentId, amountPaise, channel, idempotencyKey }),
        });
      } catch {
        // offline: queued in outbox
      }
    },
  });

  return { dues: data, isLoading, payMutation };
};

export const formatRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
