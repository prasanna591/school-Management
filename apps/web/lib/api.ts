export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001"

export async function apiRequest(
  path: string,
  opts: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
    ...opts,
    credentials: "include",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.code || res.statusText)
  }
  return res.json()
}
