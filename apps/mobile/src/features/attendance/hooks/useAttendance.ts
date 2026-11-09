import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/lib/api";
import { pushOutbox } from "@/src/lib/db";
import { theme } from "@/src/lib/theme";

type Student = { id: string; admissionNumber: string; firstName: string; lastName: string | null };

type Status = "present" | "absent" | "late" | "half-day" | "medical-leave" | "approved-leave";

export const useAttendance = () => {
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const { data: students, isLoading } = useQuery({
    queryKey: ["attendance-students"],
    queryFn: async () => apiRequest("/students?limit=100"),
  });

  const markMutation = useMutation({
    mutationFn: async ({ sessionId, studentId, status }: { sessionId: string; studentId: string; status: Status }) => {
      const payload = { sessionId, studentId, status };
      await pushOutbox("attendance", payload);
      try {
        await apiRequest(`/attendance/sessions/${sessionId}/mark`, {
          method: "POST",
          body: JSON.stringify({ studentId, status }),
        });
      } catch {
        // offline: kept in outbox for later sync
      }
      return payload;
    },
    onMutate: ({ studentId, status }) => {
      setMarks((prev) => ({ ...prev, [studentId]: status }));
    },
  });

  const createSession = async (classId: string, date: string, period?: string) => {
    return apiRequest("/attendance/sessions", {
      method: "POST",
      body: JSON.stringify({ classId, date, period }),
    });
  };

  return { students, isLoading, marks, markMutation, createSession };
};

const STATUS_LABELS: Record<Status, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half Day",
  "medical-leave": "Medical",
  "approved-leave": "Approved Leave",
};

const STATUS_COLORS: Record<Status, string> = {
  present: theme.colors.success,
  absent: theme.colors.error,
  late: theme.colors.warning,
  "half-day": theme.colors.warning,
  "medical-leave": theme.colors.textMuted,
  "approved-leave": theme.colors.textMuted,
};

export { STATUS_LABELS, STATUS_COLORS };
export type { Status, Student };
