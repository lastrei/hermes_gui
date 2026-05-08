import { Terminal, CircleDot, RefreshCw, Trash2, Settings, Menu, Plus } from 'lucide-react';
import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { ConversationDrawer } from './ConversationDrawer';

export function ChatHeader() {
  const health = useChatStore((state) => state.health);
  const status = useChatStore((state) => state.status);
  const clear = useChatStore((state) => state.clear);
  const newConversation = useChatStore((state) => state.newConversation);
  const refreshStatus = useChatStore((state) => state.refreshStatus);
  const systemPrompt = useChatStore((state) => state.systemPrompt);
  const setSystemPrompt = useChatStore((state) => state.setSystemPrompt);
  const conversations = useChatStore((state) => state.conversations);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const connected = Boolean(health?.connected);

  return (
    <>
      <header className="terminal-panel">
        <div className="terminal-panel-header justify-between">
          {/* Left: Hamburger + Logo + Title */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-hermes-500/15 bg-hermes-500/[0.06] text-hermes-400 transition hover:border-hermes-500/25 hover:bg-hermes-500/10"
              title="对话记录"
            >
              <Menu size={18} />
              {conversations.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-hermes-500/80 px-1 font-mono text-[0.5rem] font-bold text-void-900">
                  {conversations.length}
                </span>
              )}
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hermes-500/20 bg-hermes-500/10 text-hermes-400">
              <Terminal size={20} />
            </div>
            <div>
              <h1 className="ascii-glow font-mono text-base font-bold tracking-wider text-hermes-300">
                HERMES<span className="text-hermes-500">_</span>AGENT
              </h1>
              <p className="font-mono text-[0.65rem] tracking-wide text-slate-500">
                v0.1.0 · NousResearch · API Gateway UI
              </p>
            </div>
          </div>

          {/* Right: Status badges + actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Connection status */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs ${
                connected
                  ? 'border-terminal-green/20 bg-terminal-green/5 text-terminal-green'
                  : 'border-terminal-red/20 bg-terminal-red/5 text-terminal-red'
              }`}
            >
              <CircleDot size={10} className={connected ? 'animate-pulse-slow' : ''} />
              {connected ? 'ONLINE' : 'OFFLINE'}
            </div>

            {/* Stream status */}
            <div className="rounded-md border border-hermes-500/15 bg-hermes-500/5 px-2.5 py-1 font-mono text-xs text-hermes-300">
              {status === 'streaming' ? '⟫ STREAMING' : status === 'stopping' ? '⏸ STOPPING' : '● IDLE'}
            </div>

            {/* New conversation */}
            <button
              type="button"
              onClick={newConversation}
              className="inline-flex items-center gap-1.5 rounded-md border border-hermes-500/20 bg-hermes-500/[0.06] px-2.5 py-1 font-mono text-xs text-hermes-300 transition hover:bg-hermes-500/10"
              title="新建对话"
            >
              <Plus size={12} />
              NEW
            </button>

            {/* System prompt */}
            <button
              type="button"
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition hover:bg-white/5 ${
                systemPrompt
                  ? 'border-hermes-500/25 text-hermes-300'
                  : 'border-white/10 text-slate-500'
              }`}
              title="System Prompt"
            >
              <Settings size={12} />
              SYS
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => void refreshStatus()}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 font-mono text-xs text-slate-400 transition hover:border-hermes-500/20 hover:bg-hermes-500/5 hover:text-hermes-300"
            >
              <RefreshCw size={12} />
              REFRESH
            </button>

            {/* Clear */}
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 font-mono text-xs text-slate-400 transition hover:border-terminal-red/20 hover:bg-terminal-red/5 hover:text-terminal-red"
            >
              <Trash2 size={12} />
              CLEAR
            </button>
          </div>
        </div>
      </header>

      {/* System Prompt Editor (collapsible) */}
      {showPromptEditor && (
        <div className="terminal-panel animate-in">
          <div className="p-3">
            <label className="mb-2 block font-mono text-xs text-hermes-400/80">
              $ system_prompt <span className="text-slate-500">// Hermes 会叠加到核心 system prompt 上</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="例如: You are a Python expert. Always include type hints."
              rows={3}
              className="w-full resize-y rounded-md border border-hermes-500/10 bg-void-700 px-3 py-2 font-mono text-xs leading-5 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-hermes-500/30"
            />
          </div>
        </div>
      )}

      {/* Conversation history drawer */}
      <ConversationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
