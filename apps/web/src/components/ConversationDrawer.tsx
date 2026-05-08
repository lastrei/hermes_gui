import { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Trash2, Pencil, Check, Clock, Hash, Wrench } from 'lucide-react';
import { SavedConversation, useChatStore } from '../stores/chatStore';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ConversationItem({
  conversation,
  isActive,
  onLoad,
  onDelete,
  onRename,
}: {
  conversation: SavedConversation;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const msgCount = conversation.messages.length;
  const toolCount = conversation.toolEvents.length;
  const userMsgCount = conversation.messages.filter((m) => m.role === 'user').length;

  // Get a preview from the last assistant message
  const lastAssistant = [...conversation.messages].reverse().find((m) => m.role === 'assistant' && m.content.trim());
  const preview = lastAssistant
    ? lastAssistant.content.trim().slice(0, 80).replace(/\n/g, ' ')
    : '';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleRenameSubmit() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }

  return (
    <div
      className={`group rounded-lg border transition-all duration-150 ${
        isActive
          ? 'border-hermes-500/25 bg-hermes-500/[0.06]'
          : 'border-hermes-500/8 bg-void-700/30 hover:border-hermes-500/15 hover:bg-void-600/40'
      }`}
    >
      {/* Clickable area */}
      <button
        type="button"
        onClick={onLoad}
        className="w-full px-3 pb-2 pt-2.5 text-left"
      >
        {/* Title row */}
        {isEditing ? (
          <div className="mb-1.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              onBlur={handleRenameSubmit}
              className="flex-1 rounded border border-hermes-500/20 bg-void-700 px-2 py-0.5 font-mono text-xs text-hermes-200 outline-none focus:border-hermes-500/40"
            />
            <button
              type="button"
              onClick={handleRenameSubmit}
              className="rounded p-0.5 text-terminal-green hover:bg-terminal-green/10"
            >
              <Check size={12} />
            </button>
          </div>
        ) : (
          <div className="mb-1 flex items-start gap-2">
            <MessageSquare size={12} className="mt-0.5 shrink-0 text-hermes-500/50" />
            <span className="line-clamp-2 flex-1 font-mono text-xs leading-4 text-hermes-200">
              {conversation.title}
            </span>
            {isActive && (
              <span className="shrink-0 rounded border border-terminal-green/20 bg-terminal-green/5 px-1 py-0.5 font-mono text-[0.55rem] text-terminal-green">
                ACTIVE
              </span>
            )}
          </div>
        )}

        {/* Preview */}
        {preview && !isEditing && (
          <p className="mb-1.5 line-clamp-2 pl-5 font-mono text-[0.65rem] leading-4 text-slate-500">
            {preview}{preview.length >= 80 ? '…' : ''}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 pl-5 font-mono text-[0.55rem] text-slate-600">
          <span className="flex items-center gap-1">
            <Clock size={9} />
            {formatRelativeTime(conversation.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Hash size={9} />
            {userMsgCount} turns
          </span>
          {toolCount > 0 && (
            <span className="flex items-center gap-1">
              <Wrench size={9} />
              {toolCount}
            </span>
          )}
        </div>
      </button>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-1 border-t border-hermes-500/5 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditTitle(conversation.title);
            setIsEditing(true);
          }}
          className="rounded p-1 font-mono text-[0.6rem] text-slate-500 transition hover:bg-hermes-500/10 hover:text-hermes-300"
          title="重命名"
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 font-mono text-[0.6rem] text-slate-500 transition hover:bg-terminal-red/10 hover:text-terminal-red"
          title="删除"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

export function ConversationDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const conversations = useChatStore((state) => state.conversations);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const loadConversation = useChatStore((state) => state.loadConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const renameConversation = useChatStore((state) => state.renameConversation);
  const newConversation = useChatStore((state) => state.newConversation);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-hermes-500/10 bg-void-600/95 backdrop-blur-xl transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hermes-500/10 px-4 py-3">
          <div>
            <h2 className="font-mono text-sm font-bold text-hermes-300">SESSIONS</h2>
            <p className="font-mono text-[0.6rem] text-slate-500">
              {conversations.length} saved conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* New conversation button */}
        <div className="border-b border-hermes-500/8 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              newConversation();
              onClose();
            }}
            className="w-full rounded-md border border-hermes-500/20 bg-hermes-500/[0.06] px-3 py-2 font-mono text-xs text-hermes-300 transition hover:bg-hermes-500/10"
          >
            + NEW SESSION
          </button>
        </div>

        {/* Conversation list */}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeSessionId}
                  onLoad={() => {
                    loadConversation(conv.id);
                    onClose();
                  }}
                  onDelete={() => deleteConversation(conv.id)}
                  onRename={(title) => renameConversation(conv.id, title)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare size={28} className="mb-3 text-slate-700" />
              <p className="font-mono text-xs text-slate-500">
                No saved sessions
              </p>
              <p className="mt-1 font-mono text-[0.6rem] leading-4 text-slate-600">
                Conversations are auto-saved after each exchange. Start chatting to see them here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-hermes-500/8 px-4 py-2">
          <p className="font-mono text-[0.55rem] text-slate-600">
            Sessions stored in localStorage · Max 50
          </p>
        </div>
      </div>
    </>
  );
}
