type RateLimitDecision =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; remaining: 0; resetAt: number; retryAfterSeconds: number };

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const now = (): number => Date.now();

const parseCsvFirstValue = (headerValue: string | null): string | null => {
  if (!headerValue) {
    return null;
  }

  const value = headerValue.split(",")[0]?.trim();
  return value && value.length > 0 ? value : null;
};

export const getClientIdentifier = (request: Request): string => {
  const forwardedFor = parseCsvFirstValue(request.headers.get("x-forwarded-for"));
  if (forwardedFor) {
    return forwardedFor;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  return "unknown-client";
};

export const applyRateLimit = (
  request: Request,
  scope: string,
  config: RateLimitConfig,
): RateLimitDecision => {
  const clientId = getClientIdentifier(request);
  const key = `${scope}:${clientId}`;
  const current = now();

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= current) {
    const resetAt = current + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(config.maxRequests - 1, 0), resetAt };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfterMs = Math.max(existing.resetAt - current, 0);
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(Math.ceil(retryAfterMs / 1000), 1),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(config.maxRequests - existing.count, 0),
    resetAt: existing.resetAt,
  };
};

export const cleanupRateLimitBuckets = (): void => {
  const current = now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= current) {
      buckets.delete(key);
    }
  }
};

export const getPayloadTooLargeResponse = (): Response =>
  Response.json(
    {
      error: "El payload excede el limite permitido",
    },
    { status: 413 },
  );

export const isPayloadWithinLimit = (request: Request, maxBytes: number): boolean => {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return true;
  }

  const parsed = Number(contentLength);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return true;
  }

  return parsed <= maxBytes;
};

export const getRateLimitedResponse = (
  decision: Extract<RateLimitDecision, { allowed: false }>,
): Response => {
  const resetSeconds = Math.max(Math.ceil((decision.resetAt - now()) / 1000), 1);

  return new Response(
    JSON.stringify({
      error: "Has excedido el limite de solicitudes. Intenta nuevamente en unos segundos.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(decision.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetSeconds),
      },
    },
  );
};
