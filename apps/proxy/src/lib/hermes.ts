export const HERMES_API_BASE_URL = trimTrailingSlash(
  process.env.HERMES_API_BASE_URL ?? 'http://localhost:8642',
);

export const HERMES_API_KEY = process.env.HERMES_API_KEY ?? '';
export const HERMES_MODEL = process.env.HERMES_MODEL ?? 'hermes-agent';
export const PROXY_CORS_ORIGIN = process.env.PROXY_CORS_ORIGIN ?? 'http://localhost:5600';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function hermesUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${HERMES_API_BASE_URL}${normalizedPath}`;
}

export function hermesAuthHeaders(): HeadersInit {
  return HERMES_API_KEY ? { Authorization: `Bearer ${HERMES_API_KEY}` } : {};
}

export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': PROXY_CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Idempotency-Key',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export function jsonHeaders(): HeadersInit {
  return {
    ...corsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}

export function sseHeaders(contentType?: string | null): HeadersInit {
  return {
    ...corsHeaders(),
    'Content-Type': contentType ?? 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
