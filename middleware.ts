import { NextRequest, NextResponse } from 'next/server';

// In-memory sliding window rate limiter per IP
// Limits: 120 page requests per 60 seconds per IP
// Resets on server restart (fine for an internal tool)
const map = new Map<string, { count: number; resetAt: number }>();

const LIMIT  = 120;       // requests allowed
const WINDOW = 60_000;    // per 60 seconds (ms)

// Routes not subject to rate limiting (static assets, Next internals)
const BYPASS = /^\/_next\/|^\/assets\/|^\/favicon/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BYPASS.test(pathname)) return NextResponse.next();

  // Resolve IP: Vercel sets x-forwarded-for; fallback for local dev
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const now = Date.now();
  const entry = map.get(ip);

  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + WINDOW });
    return NextResponse.next();
  }

  if (entry.count >= LIMIT) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
