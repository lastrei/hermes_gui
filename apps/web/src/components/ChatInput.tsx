import { FormEvent, KeyboardEvent, useState } from 'react';
import { Send, Square, ChevronRight } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';

export function ChatInput() {
  const [value, setValue] = useState('');
  const sendMessage = useChatStore((state) => state.sendMessage);
  const stop = useChatStore((state) => state.stop);
  const status = useChatStore((state) => state.status);
  const isStreaming = status === 'streaming' || status === 'stopping';

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (isStreaming || !value.trim()) {
      return;
    }

    const nextValue = value;
    setValue('');
    await sendMessage(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-hermes-500/10 bg-void-600/80 p-3">
      <div className="glow-focus rounded-lg border border-hermes-500/10 bg-void-700/80 p-2 transition">
        <div className="mb-1 flex items-center gap-1.5 px-2 font-mono text-[0.65rem] text-hermes-500/50">
          <ChevronRight size={10} />
          <span>hermes-agent</span>
          <span className="text-slate-600">//</span>
          <span className="text-slate-500">chat.completions</span>
        </div>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息… Enter 发送, Shift+Enter 换行"
          rows={3}
          className="max-h-48 min-h-[60px] w-full resize-y border-0 bg-transparent px-2 py-1.5 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
          disabled={isStreaming}
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <p className="font-mono text-[0.6rem] text-slate-600">
            POST /v1/chat/completions · stream: true · SSE
          </p>
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1.5 rounded-md border border-terminal-red/30 bg-terminal-red/10 px-3 py-1.5 font-mono text-xs font-medium text-terminal-red transition hover:bg-terminal-red/20"
            >
              <Square size={12} />
              STOP
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              className="inline-flex items-center gap-1.5 rounded-md border border-hermes-500/30 bg-hermes-500/10 px-3 py-1.5 font-mono text-xs font-medium text-hermes-300 transition hover:bg-hermes-500/20 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.02] disabled:text-slate-600"
            >
              <Send size={12} />
              SEND
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
