import { supabaseAdmin } from "./supabaseAdmin.ts";
import { createErrorResponse } from "./utils.ts";

// Rate limiting: Simple in-memory store (resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

interface ApiKey {
  id: number;
  sales_id: number;
  name: string;
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
}

/**
 * Extract and validate API key from request
 * Returns api key record or error response
 */
export async function validateApiKey(
  req: Request
): Promise<{ apiKey: ApiKey } | Response> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return createErrorResponse(401, "Missing or invalid Authorization header");
  }

  const apiKeyValue = authHeader.replace("Bearer ", "");

  if (!apiKeyValue.startsWith("ak_live_")) {
    return createErrorResponse(401, "Invalid API key format");
  }

  // Hash the API key for lookup
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKeyValue);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    ""
  );

  // Lookup API key in database
  const { data: apiKey, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, sales_id, name, scopes, is_active, expires_at")
    .eq("key_hash", keyHash)
    .single();

  if (error || !apiKey) {
    return createErrorResponse(401, "Invalid API key");
  }

  // Check if active
  if (!apiKey.is_active) {
    return createErrorResponse(401, "API key is disabled");
  }

  // Check expiration
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return createErrorResponse(401, "API key has expired");
  }

  // Update last_used_at (fire and forget)
  supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return { apiKey };
}

/**
 * Check rate limit for API key
 */
export function checkRateLimit(apiKeyId: number): Response | null {
  const now = Date.now();
  const key = `ratelimit:${apiKeyId}`;

  let bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    // Create new bucket
    bucket = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(key, bucket);
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({
        status: 429,
        message: "Rate limit exceeded",
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": bucket.resetAt.toString(),
        },
      }
    );
  }

  bucket.count++;

  return null;
}

/**
 * Check if API key has required scope
 */
export function hasScope(apiKey: ApiKey, requiredScope: string): boolean {
  // Check for wildcard scope
  if (apiKey.scopes.includes("*")) {
    return true;
  }

  // Check for exact scope match
  if (apiKey.scopes.includes(requiredScope)) {
    return true;
  }

  // Check for resource wildcard (e.g., "contacts:*" matches "contacts:read")
  const [resource] = requiredScope.split(":");
  if (apiKey.scopes.includes(`${resource}:*`)) {
    return true;
  }

  return false;
}

/**
 * Log API request
 */
export async function logApiRequest(
  apiKeyId: number,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  req: Request,
  errorMessage?: string
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = req.headers.get("user-agent");

  await supabaseAdmin.from("api_logs").insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ip,
    user_agent: userAgent,
    error_message: errorMessage,
  });
}
