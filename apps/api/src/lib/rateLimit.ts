import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    redis = new Redis(url, { lazyConnect: true });
  }
  return redis;
}

type RateLimitRule = {
  windowSeconds: number;
  maxRequests: number;
};

// Rate limit rules per route pattern
const ROUTE_RULES: Record<string, RateLimitRule> = {
  // Auth: strict
  "POST:/api/auth/send-otp": { windowSeconds: 60, maxRequests: 5 },
  "POST:/api/auth/verify-otp": { windowSeconds: 60, maxRequests: 10 },
  "POST:/api/auth/refresh": { windowSeconds: 60, maxRequests: 20 },
  // Payments: strict
  "POST:/api/payments/orders": { windowSeconds: 60, maxRequests: 10 },
  "POST:/api/payments/webhook/:gateway": { windowSeconds: 60, maxRequests: 100 },
  // Search: moderate
  "GET:/api/students": { windowSeconds: 60, maxRequests: 30 },
  // Messages: moderate
  "POST:/api/message-threads/:threadId/messages": { windowSeconds: 60, maxRequests: 20 },
  // Default global: lenient
  default: { windowSeconds: 60, maxRequests: 100 },
};

export function getRule(method: string, path: string): RateLimitRule {
  const key = `${method}:${path}`;
  if (ROUTE_RULES[key]) return ROUTE_RULES[key];
  // Check pattern matches (e.g., /api/payments/webhook/:gateway)
  for (const [pattern, rule] of Object.entries(ROUTE_RULES)) {
    if (pattern === "default") continue;
    const [pMethod, pPath] = pattern.split(":", 2);
    if (pMethod !== method) continue;
    if (pathMatchesPattern(path, pPath)) return rule;
  }
  return ROUTE_RULES.default;
}

export function pathMatchesPattern(path: string, pattern: string): boolean {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return false;
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) continue; // wildcard param
    if (patternParts[i] !== pathParts[i]) return false;
  }
  return true;
}

function rateLimitKey(
  method: string,
  path: string,
  identifier: string
): string {
  return `ratelimit:${method}:${path}:${identifier}`;
}

/**
 * Check and increment rate limit. Returns { allowed, remaining, reset }.
 * If Redis is unavailable, allows the request (fail open for availability).
 */
export async function checkRateLimit({
  method,
  path,
  identifier,
}: {
  method: string;
  path: string;
  identifier: string;
}): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const r = getRedis();
  if (!r) {
    // Fail open if Redis unavailable
    return { allowed: true, remaining: 999, reset: 0 };
  }

  const rule = getRule(method, path);
  const key = rateLimitKey(method, path, identifier);

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % rule.windowSeconds);
  const windowKey = `${key}:${windowStart}`;
  const reset = windowStart + rule.windowSeconds;

  const count = await r.incr(windowKey);
  await r.expire(windowKey, rule.windowSeconds);

  return {
    allowed: count <= rule.maxRequests,
    remaining: Math.max(0, rule.maxRequests - Number(count)),
    reset,
  };
}
