import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://10.0.2.2:3001";

export async function apiRequest(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.code || res.statusText);
  }
  return res.json();
}

let tokenCache: string | null = null;
export async function getToken() {
  if (tokenCache) return tokenCache;
  const { getItemAsync } = await import("expo-secure-store");
  tokenCache = await getItemAsync("access_token");
  return tokenCache;
}
export function setToken(token: string) {
  tokenCache = token;
  return (async () => {
    const { setItemAsync } = await import("expo-secure-store");
    await setItemAsync("access_token", token);
  })();
}
export async function clearToken() {
  tokenCache = null;
  const { deleteItemAsync } = await import("expo-secure-store");
  await deleteItemAsync("access_token");
}
