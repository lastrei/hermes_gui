import { HERMES_MODEL, hermesAuthHeaders, hermesUrl, jsonResponse, optionsResponse } from '@/lib/hermes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const detailed = await fetch(hermesUrl('/health/detailed'), {
      headers: hermesAuthHeaders(),
      cache: 'no-store',
    });

    if (detailed.ok) {
      const details = await detailed.json();
      return jsonResponse({ connected: true, model: HERMES_MODEL, details });
    }

    const basic = await fetch(hermesUrl('/health'), {
      headers: hermesAuthHeaders(),
      cache: 'no-store',
    });

    if (basic.ok) {
      const details = await basic.json();
      return jsonResponse({ connected: true, model: HERMES_MODEL, details });
    }

    return jsonResponse(
      {
        connected: false,
        model: HERMES_MODEL,
        error: 'Hermes health checks failed.',
        status: basic.status,
        details: await basic.text(),
      },
      { status: 502 },
    );
  } catch (error) {
    return jsonResponse(
      {
        connected: false,
        model: HERMES_MODEL,
        error: 'Unable to reach Hermes API Server.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
