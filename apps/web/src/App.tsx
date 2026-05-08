import { useEffect, useRef } from 'react';
import { AgentPanel } from './components/AgentPanel';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { ToolLogPanel } from './components/ToolLogPanel';
import { StatusBar } from './components/StatusBar';
import { useChatStore } from './stores/chatStore';

export function App() {
  const refreshStatus = useChatStore((state) => state.refreshStatus);
  const error = useChatStore((state) => state.error);
  const didInit = useRef(false);

  // On mount: always start with a fresh session
  // The store's persist only saves `conversations` and `systemPrompt`,
  // so active messages are already empty after hydration.
  // But just in case — explicitly ensure a clean slate.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const state = useChatStore.getState();
    // If there are leftover messages from a crashed session, save and clear
    if (state.messages.length > 0) {
      state.saveCurrentSession();
      state.clear();
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const interval = window.setInterval(() => void refreshStatus(), 30_000);

    return () => window.clearInterval(interval);
  }, [refreshStatus]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+L = clear current session
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        useChatStore.getState().clear();
      }
      // Ctrl+N = new conversation
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        useChatStore.getState().newConversation();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* CRT scanline overlay */}
      <div className="crt-overlay" />

      <div className="flex min-h-screen flex-col px-3 pb-8 pt-3 text-slate-200 sm:px-4 lg:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3">
          <ChatHeader />

          {error ? (
            <div className="terminal-panel border-terminal-red/20 px-4 py-2.5">
              <p className="font-mono text-xs text-terminal-red">
                <span className="text-terminal-red/60">ERR </span>
                {error}
              </p>
            </div>
          ) : null}

          <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="terminal-panel flex min-h-[70vh] flex-col overflow-hidden">
              <MessageList />
              <ChatInput />
            </section>

            <aside className="flex min-h-[70vh] flex-col gap-3">
              <AgentPanel />
              <ToolLogPanel />
            </aside>
          </div>
        </div>
      </div>

      <StatusBar />
    </>
  );
}
