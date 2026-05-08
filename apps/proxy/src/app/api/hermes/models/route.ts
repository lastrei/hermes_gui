import { hermesAuthHeaders, hermesUrl, jsonResponse, optionsResponse } from '@/lib/hermes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  try {
    const upstream = await fetch(hermesUrl('/v1/models'), {
      headers: hermesAuthHeaders(),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return jsonResponse(
        {
          error: 'Hermes models endpoint returned an error.',
          status: upstream.status,
          details: await upstream.text(),
        },
        { status: upstream.status },
      );
    }

    return jsonResponse(await upstream.json());
  } catch (error) {
    return jsonResponse(
      {
        error: 'Unable to reach Hermes models endpoint.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
