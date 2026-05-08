import { HERMES_API_KEY, HERMES_MODEL, hermesUrl, jsonResponse, optionsResponse, sseHeaders } from '@/lib/hermes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

type ChatMessage = {
  role: ChatRole;
  content: unknown;
  name?: string;
  tool_call_id?: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string | string[];
};

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  if (!HERMES_API_KEY) {
    return jsonResponse(
      {
        error: 'HERMES_API_KEY is not configured on the Next.js proxy.',
      },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse(
      {
        error: 'Expected a non-empty messages array in OpenAI Chat Completions format.',
      },
      { status: 400 },
    );
  }

  const upstreamPayload = {
    ...body,
    model: body.model || HERMES_MODEL,
    stream: true,
  };

  try {
    const upstream = await fetch(hermesUrl('/v1/chat/completions'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HERMES_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(upstreamPayload),
      signal: request.signal,
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const details = await upstream.text();

      return jsonResponse(
        {
          error: 'Hermes API Server returned an error.',
          status: upstream.status,
          details,
        },
        { status: upstream.status },
      );
    }

    if (!upstream.body) {
      return jsonResponse(
        {
          error: 'Hermes API Server did not return a response stream.',
        },
        { status: 502 },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: sseHeaders(upstream.headers.get('content-type')),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return jsonResponse({ error: 'Client aborted the streaming request.' }, { status: 499 });
    }

    return jsonResponse(
      {
        error: 'Unable to reach Hermes API Server.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
