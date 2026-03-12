type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const entry = store.get(key) ?? { timestamps: [] };
  const timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);

  if (timestamps.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
    store.set(key, { timestamps });
    return { allowed: false, retryAfter };
  }

  timestamps.push(now);
  store.set(key, { timestamps });
  return { allowed: true, retryAfter: 0 };
}