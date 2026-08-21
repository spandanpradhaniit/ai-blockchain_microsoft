/**
 * In-Memory Token Bucket Rate Limiter
 *
 * Designed for rate-limiting requests by client IP / wallet address in demo environments.
 * Limits users to `maxTokens` within a specified `windowMs` window.
 */

interface RateLimitStore {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitStore>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): RateLimitResult {
  const now = Date.now();
  const clientData = store.get(identifier) || { tokens: limit, lastRefill: now };

  // Refill tokens based on elapsed time
  const timePassed = now - clientData.lastRefill;
  const tokensToAdd = Math.floor((timePassed / windowMs) * limit);

  if (tokensToAdd > 0) {
    clientData.tokens = Math.min(limit, clientData.tokens + tokensToAdd);
    clientData.lastRefill = now;
  }

  if (clientData.tokens > 0) {
    clientData.tokens -= 1;
    store.set(identifier, clientData);
    return {
      success: true,
      limit,
      remaining: clientData.tokens,
      resetMs: windowMs - (now - clientData.lastRefill),
    };
  }

  return {
    success: false,
    limit,
    remaining: 0,
    resetMs: windowMs - (now - clientData.lastRefill),
  };
}
