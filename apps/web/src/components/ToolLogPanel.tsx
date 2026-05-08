import { TerminalSquare, ChevronRight } from 'lucide-react';
import { ToolEvent, useChatStore } from '../stores/chatStore';

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'success') return 'text-terminal-green';
  if (s === 'running' || s === 'in_progress' || s === 'started') return 'text-terminal-amber';
  if (s === 'failed' || s === 'error') return 'text-terminal-red';
  return 'text-terminal-cyan';
}

function ToolEventItem({ event }: { event: ToolEvent }) {
  return (
    <li className="tool-log-entry rounded-md border border-hermes-500/10 bg-void-700/40 px-3 py-2">
      {/* Header: name + time */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <ChevronRight size={10} className="shrink-0 text-terminal-green" />
          <span className="truncate font-bold text-hermes-200">{event.name}</span>
        </div>
        <span className="shrink-0 text-[0.6rem] text-slate-600">{formatTime(event.createdAt)}</span>
      </div>
      {/* Status badge */}
      <span className={`inline-block rounded border border-current/10 bg-current/5 px-1.5 py-0.5 text-[0.6rem] ${statusColor(event.status)}`}>
        {event.status}
      </span>
      {/* Detail */}
      <p className="mt-1.5 whitespace-pre-wrap break-words text-[0.7rem] leading-4 text-slate-500">
        {event.detail}
      </p>
    </li>
  );
}

export function ToolLogPanel() {
  const toolEvents = useChatStore((state) => state.toolEvents);
  const latestEvents = [...toolEvents].reverse();

  return (
    <section className="terminal-panel flex flex-1 flex-col overflow-hidden">
      <div className="terminal-panel-header justify-between">
        <span className="font-mono text-xs font-medium text-hermes-300">TOOL LOG</span>
        <TerminalSquare size={14} className="text-hermes-500/50" />
      </div>

      {latestEvents.length ? (
        <ul className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
          {latestEvents.map((event) => (
            <ToolEventItem key={event.id} event={event} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <TerminalSquare size={24} className="mb-3 text-slate-700" />
          <p className="font-mono text-xs text-slate-500">
            No tool events yet
          </p>
          <p className="mt-1 font-mono text-[0.6rem] leading-4 text-slate-600">
            When Hermes calls terminal, file, web, or memory tools, progress events appear here via <span className="text-hermes-500/50">hermes.tool.progress</span> SSE.
          </p>
        </div>
      )}
    </section>
  );
}
