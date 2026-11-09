import { create } from "zustand";

interface SessionState {
  tenantId: string | null;
  role: string | null;
  userId: string | null;
  language: string;
  setSession: (tenantId: string, role: string, userId: string) => void;
  clearSession: () => void;
  setLanguage: (lang: string) => void;
}

export const useSession = create<SessionState>((set) => ({
  tenantId: null,
  role: null,
  userId: null,
  language: "en",
  setSession: (tenantId, role, userId) => set({ tenantId, role, userId }),
  clearSession: () => set({ tenantId: null, role: null, userId: null }),
  setLanguage: (lang) => set({ language: lang }),
}));
