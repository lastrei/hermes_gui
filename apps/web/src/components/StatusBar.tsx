import { Wifi, WifiOff, Hash, Clock, Terminal, Database } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';

function formatUptime() {
  const now = new Date();
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);
}

export function StatusBar() {
  const health = useChatStore((state) => state.health);
  const status = useChatStore((state) => state.status);
  const messages = useChatStore((state) => state.messages);
  const toolEvents = useChatStore((state) => state.toolEvents);
  const tokenCount = useChatStore((state) => state.tokenCount);
  const conversations = useChatStore((state) => state.conversations);
  const connected = Boolean(health?.connected);

  return (
    <footer className="status-bar fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 px-4 py-1">
      <div className="flex items-center gap-4">
        {/* Connection */}
        <div className={`flex items-center gap-1.5 ${connected ? 'text-terminal-green' : 'text-terminal-red'}`}>
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span>{connected ? 'Hermes Connected' : 'Disconnected'}</span>
        </div>

        {/* Model */}
        <div className="flex items-center gap-1.5 text-slate-500">
          <Terminal size={10} />
          <span>{health?.model ?? 'hermes-agent'}</span>
        </div>

        {/* Status */}
        {status === 'streaming' && (
          <div className="flex items-center gap-1.5 text-terminal-amber">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-terminal-amber" />
            <span>Streaming</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-slate-600">
        {/* Saved sessions */}
        <div className="flex items-center gap-1.5">
          <Database size={10} />
          <span>{conversations.length} sessions</span>
        </div>

        {/* Message count */}
        <div className="flex items-center gap-1.5">
          <Hash size={10} />
          <span>{messages.length} msgs · {toolEvents.length} tools · {tokenCount} tokens</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Clock size={10} />
          <span>{formatUptime()}</span>
        </div>
      </div>
    </footer>
  );
}
