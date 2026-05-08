import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { proxyUrl } from '../lib/api';

export type ChatRole = 'system' | 'user' | 'assistant';
export type ChatStatus = 'idle' | 'streaming' | 'stopping';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type ToolEvent = {
  id: string;
  name: string;
  status: string;
  detail: string;
  createdAt: number;
};

export type HermesHealth = {
  connected: boolean;
  model?: string;
  details?: Record<string, unknown>;
  error?: string;
};

export type HermesCapabilities = {
  object?: string;
  platform?: string;
  model?: string;
  auth?: unknown;
  features?: Record<string, boolean>;
  error?: string;
};

export type HermesModel = {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
};

/* ──── Saved conversation snapshot ──── */
export type SavedConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  toolEvents: ToolEvent[];
  systemPrompt: string;
  tokenCount: number;
  createdAt: number;
  updatedAt: number;
};

type SseEvent = {
  event: string;
  data: string;
};

type ChatState = {
  /* ── Active session ── */
  activeSessionId: string | null;
  messages: ChatMessage[];
  toolEvents: ToolEvent[];
  status: ChatStatus;
  error: string | null;
  health: HermesHealth | null;
  capabilities: HermesCapabilities | null;
  models: HermesModel[];
  systemPrompt: string;
  controller?: AbortController;
  tokenCount: number;

  /* ── Conversation archive ── */
  conversations: SavedConversation[];

  /* ── Actions: chat ── */
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
  refreshStatus: () => Promise<void>;
  setSystemPrompt: (prompt: string) => void;

  /* ── Actions: conversation management ── */
  newConversation: () => void;
  saveCurrentSession: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
};

/* ──── Helpers ──── */

function createId(prefix: string) {
  if ('crypto' in globalThis && typeof globalThis.crypto.randomUUID === 'function') {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');

  if (firstUserMsg) {
    const text = firstUserMsg.content.trim();
    return text.length > 60 ? text.slice(0, 57) + '…' : text;
  }

  return `Session ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
}

function getDelimiter(buffer: string) {
  const lfIndex = buffer.indexOf('\n\n');
  const crlfIndex = buffer.indexOf('\r\n\r\n');

  if (lfIndex === -1 && crlfIndex === -1) {
    return null;
  }

  if (lfIndex !== -1 && (crlfIndex === -1 || lfIndex < crlfIndex)) {
    return { index: lfIndex, length: 2 };
  }

  return { index: crlfIndex, length: 4 };
}

function parseSseFrame(frame: string): SseEvent | null {
  if (!frame.trim()) {
    return null;
  }

  let event = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  return {
    event,
    data: dataLines.join('\n'),
  };
}

function extractToolEvent(payload: unknown): Pick<ToolEvent, 'name' | 'status' | 'detail'> {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const name = String(record.name ?? record.tool ?? record.type ?? 'tool');
    const status = String(record.status ?? record.state ?? 'running');
    const detail = String(
      record.message ?? record.detail ?? record.text ?? record.input ?? JSON.stringify(record, null, 2),
    );

    return { name, status, detail };
  }

  return { name: 'tool', status: 'running', detail: String(payload) };
}

function toErrorMessage(payload: unknown) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    return String(record.error ?? record.message ?? JSON.stringify(record));
  }

  return String(payload);
}

function parseJsonOrText(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function readSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => boolean | void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const delimiter = getDelimiter(buffer);

      if (!delimiter) {
        break;
      }

      const frame = buffer.slice(0, delimiter.index);
      buffer = buffer.slice(delimiter.index + delimiter.length);
      const event = parseSseFrame(frame);

      if (event && onEvent(event) === true) {
        return;
      }
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const event = parseSseFrame(buffer);
    if (event) {
      onEvent(event);
    }
  }
}

/* ──── The empty session state (reusable) ──── */
const EMPTY_SESSION = {
  activeSessionId: null,
  messages: [] as ChatMessage[],
  toolEvents: [] as ToolEvent[],
  status: 'idle' as ChatStatus,
  error: null,
  controller: undefined,
  tokenCount: 0,
  systemPrompt: '',
};

/* ──── Store ──── */

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...EMPTY_SESSION,
      health: null,
      capabilities: null,
      models: [],
      conversations: [],

      /* ─────────────────── Chat actions ─────────────────── */

      async sendMessage(content: string) {
        const trimmedContent = content.trim();

        if (!trimmedContent || get().status === 'streaming') {
          return;
        }

        // Auto-assign a session id if we don't have one yet
        if (!get().activeSessionId) {
          set({ activeSessionId: createId('sess') });
        }

        const controller = new AbortController();
        const userMessage: ChatMessage = {
          id: createId('msg'),
          role: 'user',
          content: trimmedContent,
          createdAt: Date.now(),
        };
        const assistantMessage: ChatMessage = {
          id: createId('msg'),
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
        };

        const systemPrompt = get().systemPrompt.trim();
        const apiMessages: Array<{ role: string; content: string }> = [];

        if (systemPrompt) {
          apiMessages.push({ role: 'system', content: systemPrompt });
        }

        const conversationMessages = [...get().messages, userMessage]
          .filter((message) => message.content.trim().length > 0)
          .map((message) => ({ role: message.role, content: message.content }));

        apiMessages.push(...conversationMessages);

        set((state) => ({
          messages: [...state.messages, userMessage, assistantMessage],
          status: 'streaming',
          error: null,
          controller,
        }));

        try {
          const response = await fetch(proxyUrl('/api/hermes/chat'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: apiMessages }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(toErrorMessage(parseJsonOrText(text)) || `Request failed with ${response.status}`);
          }

          if (!response.body) {
            throw new Error('Proxy did not return a streaming response body.');
          }

          await readSseStream(response.body, ({ event, data }) => {
            if (data === '[DONE]') {
              return true;
            }

            const payload = data ? parseJsonOrText(data) : null;

            if (event === 'hermes.tool.progress') {
              const tool = extractToolEvent(payload);
              set((state) => ({
                toolEvents: [
                  ...state.toolEvents,
                  {
                    id: createId('tool'),
                    createdAt: Date.now(),
                    ...tool,
                  },
                ].slice(-200),
              }));
              return;
            }

            if (event === 'error') {
              set({ error: toErrorMessage(payload) });
              return;
            }

            if (payload && typeof payload === 'object') {
              const record = payload as Record<string, unknown>;
              const choices = record.choices as Array<Record<string, unknown>> | undefined;
              const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
              const token = typeof delta?.content === 'string' ? delta.content : '';

              if (token) {
                set((state) => ({
                  messages: state.messages.map((message) =>
                    message.id === assistantMessage.id
                      ? { ...message, content: message.content + token }
                      : message,
                  ),
                  tokenCount: state.tokenCount + 1,
                }));
              }
            }
          });

          set({ status: 'idle', controller: undefined });

          // Auto-save after each completed exchange
          get().saveCurrentSession();
        } catch (error) {
          const isAbort = error instanceof Error && error.name === 'AbortError';

          set({
            status: 'idle',
            controller: undefined,
            error: isAbort ? null : error instanceof Error ? error.message : String(error),
          });

          // Still auto-save even on error (keeps partial assistant response)
          if (get().messages.length > 0) {
            get().saveCurrentSession();
          }
        }
      },

      stop() {
        const controller = get().controller;

        if (controller) {
          set({ status: 'stopping' });
          controller.abort();
        }
      },

      clear() {
        get().controller?.abort();
        set({ ...EMPTY_SESSION });
      },

      async refreshStatus() {
        const [healthResult, capabilitiesResult, modelsResult] = await Promise.allSettled([
          fetch(proxyUrl('/api/hermes/health'), { cache: 'no-store' }).then((response) => response.json()),
          fetch(proxyUrl('/api/hermes/capabilities'), { cache: 'no-store' }).then((response) => response.json()),
          fetch(proxyUrl('/api/hermes/models'), { cache: 'no-store' }).then((response) => response.json()),
        ]);

        const models: HermesModel[] = [];
        if (modelsResult.status === 'fulfilled') {
          const result = modelsResult.value as Record<string, unknown>;
          if (Array.isArray(result.data)) {
            models.push(...(result.data as HermesModel[]));
          }
        }

        set({
          health:
            healthResult.status === 'fulfilled'
              ? (healthResult.value as HermesHealth)
              : { connected: false, error: healthResult.reason instanceof Error ? healthResult.reason.message : String(healthResult.reason) },
          capabilities:
            capabilitiesResult.status === 'fulfilled'
              ? (capabilitiesResult.value as HermesCapabilities)
              : { error: capabilitiesResult.reason instanceof Error ? capabilitiesResult.reason.message : String(capabilitiesResult.reason) },
          models,
        });
      },

      setSystemPrompt(prompt: string) {
        set({ systemPrompt: prompt });
      },

      /* ─────────────── Conversation management ─────────────── */

      newConversation() {
        const state = get();

        // Auto-save the current session if it has content
        if (state.messages.length > 0) {
          state.saveCurrentSession();
        }

        state.controller?.abort();
        set({ ...EMPTY_SESSION });
      },

      saveCurrentSession() {
        const state = get();

        if (state.messages.length === 0) {
          return;
        }

        const now = Date.now();
        const sessionId = state.activeSessionId ?? createId('sess');
        const existingIndex = state.conversations.findIndex((c) => c.id === sessionId);

        const snapshot: SavedConversation = {
          id: sessionId,
          title: deriveTitle(state.messages),
          messages: state.messages,
          toolEvents: state.toolEvents,
          systemPrompt: state.systemPrompt,
          tokenCount: state.tokenCount,
          createdAt: existingIndex >= 0 ? state.conversations[existingIndex].createdAt : now,
          updatedAt: now,
        };

        set((s) => {
          const next = s.conversations.filter((c) => c.id !== sessionId);
          // Prepend (most recent first), cap at 50 conversations
          next.unshift(snapshot);
          return {
            activeSessionId: sessionId,
            conversations: next.slice(0, 50),
          };
        });
      },

      loadConversation(id: string) {
        const state = get();
        const target = state.conversations.find((c) => c.id === id);

        if (!target) {
          return;
        }

        // Save current session before switching (if it has content)
        if (state.messages.length > 0 && state.activeSessionId !== id) {
          state.saveCurrentSession();
        }

        state.controller?.abort();

        set({
          activeSessionId: target.id,
          messages: target.messages,
          toolEvents: target.toolEvents,
          systemPrompt: target.systemPrompt,
          tokenCount: target.tokenCount,
          status: 'idle',
          error: null,
          controller: undefined,
        });
      },

      deleteConversation(id: string) {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          // If we deleted the active conversation, reset to empty
          ...(s.activeSessionId === id ? EMPTY_SESSION : {}),
        }));
      },

      renameConversation(id: string, title: string) {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title: title.trim() || c.title } : c,
          ),
        }));
      },
    }),
    {
      name: 'hermes-gui-chat-v2',
      partialize: (state) => ({
        conversations: state.conversations,
        systemPrompt: state.systemPrompt,
      }),
    },
  ),
);
