import { useEffect, useRef } from 'react';
import { Terminal, User, Sparkles } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import { ChatMessage, useChatStore } from '../stores/chatStore';

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}

function MessageBubble({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const isAssistant = message.role === 'assistant';
  const status = useChatStore((state) => state.status);
  const isCurrentlyStreaming = isAssistant && isLatest && status === 'streaming';

  return (
    <article className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hermes-500/20 bg-hermes-500/10 text-hermes-400">
          <Terminal size={14} />
        </div>
      ) : null}

      <div className={`max-w-[82%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {/* Meta line */}
        <div className={`mb-1 flex items-center gap-2 font-mono text-[0.65rem] text-slate-600 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          <span>{isAssistant ? 'hermes' : 'user'}</span>
          <span className="text-slate-700">·</span>
          <span>{formatTime(message.createdAt)}</span>
          {isCurrentlyStreaming && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-terminal-green neon-badge">streaming</span>
            </>
          )}
        </div>

        {/* Message body */}
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-6 ${
            isAssistant
              ? 'border border-hermes-500/10 bg-void-600/60 text-slate-200'
              : 'border border-hermes-500/20 bg-hermes-500/10 text-hermes-100'
          }`}
        >
          {message.content ? (
            isAssistant ? (
              <div className={isCurrentlyStreaming ? 'blinking-cursor' : ''}>
                <MarkdownContent content={message.content} />
              </div>
            ) : (
              <span className="whitespace-pre-wrap">{message.content}</span>
            )
          ) : (
            <span className="inline-flex items-center gap-2 font-mono text-xs text-hermes-500/60">
              <Sparkles size={12} className="animate-pulse" />
              awaiting response...
            </span>
          )}
        </div>
      </div>

      {!isAssistant ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400">
          <User size={14} />
        </div>
      ) : null}
    </article>
  );
}

const ASCII_HERMES = `
 ██╗  ██╗███████╗██████╗ ███╗   ███╗███████╗███████╗
 ██║  ██║██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝
 ███████║█████╗  ██████╔╝██╔████╔██║█████╗  ███████╗
 ██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ╚════██║
 ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗███████║
 ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝`;

const EXAMPLES = [
  'Hello! Tell me about your capabilities.',
  'List all API endpoints you support.',
  'Write a Python fibonacci with type hints.',
];

export function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const status = useChatStore((state) => state.status);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: status === 'streaming' ? 'auto' : 'smooth',
    });
  }, [messages, status]);

  return (
    <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">
      {hasMessages ? (
        <div className="space-y-5">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full min-h-[48vh] flex-col items-center justify-center text-center">
          {/* ASCII Art Logo */}
          <pre className="ascii-glow mb-4 select-none font-mono text-[0.4rem] font-bold leading-[1.1] text-hermes-400 sm:text-[0.55rem]" style={{ textShadow: '0 0 10px rgba(234,179,8,0.5), 0 0 40px rgba(234,179,8,0.2)' }}>
            {ASCII_HERMES}
          </pre>
          <p className="mb-1 font-mono text-sm tracking-wider text-hermes-300/80">
            AGENT TERMINAL
          </p>
          <p className="mb-6 max-w-md font-mono text-xs leading-5 text-slate-500">
            Messages are proxied through Next.js to <span className="text-hermes-500/60">localhost:8642/v1/chat/completions</span> via SSE streaming.
          </p>

          {/* Example prompts */}
          <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-3">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => void sendMessage(example)}
                className="group rounded-lg border border-hermes-500/10 bg-void-600/40 p-3 text-left font-mono text-xs leading-5 text-slate-400 transition-all duration-200 hover:border-hermes-500/25 hover:bg-hermes-500/[0.06] hover:text-hermes-200 hover:shadow-glow-sm hover:-translate-y-0.5"
              >
                <span className="text-hermes-500/40 group-hover:text-hermes-500/70">$ </span>
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
