import { NextRequest, NextResponse } from "next/server";

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "10000");
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function proxy(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();

  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil(
      (WINDOW_MS - (now - entry.windowStart)) / 1000
    );
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
        },
      }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/recommend/:path*", "/api/steam/:path*", "/api/games/:path*"],
};
