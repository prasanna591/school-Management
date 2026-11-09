export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(^|;) access_token=([^;]+)/)
  return match ? match[2] : null
}

export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(^|;) refresh_token=([^;]+)/)
  return match ? match[2] : null
}
