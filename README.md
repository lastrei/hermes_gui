# HERMES_AGENT // Terminal UI

<div align="center">

```
 ██╗  ██╗███████╗██████╗ ███╗   ███╗███████╗███████╗
 ██║  ██║██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝
 ███████║█████╗  ██████╔╝██╔████╔██║█████╗  ███████╗
 ██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ╚════██║
 ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗███████║
 ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝
```

**Geek-style Terminal UI for [NousResearch Hermes Agent](https://hermes-agent.nousresearch.com/)**

React · Vite · Zustand · Tailwind CSS · Next.js Proxy · SSE Streaming

</div>

---

## 📐 Architecture

```
┌─────────────────────┐     HTTP / SSE     ┌──────────────────┐     Internal HTTP     ┌─────────────────────┐
│                     │ ─────────────────→ │                  │ ──────────────────→  │                     │
│   React / Vite UI   │     /api/hermes/*  │  Next.js Proxy   │    /v1/*, /health    │  Hermes API Server  │
│   (port 5600)       │ ←───────────────── │  (port 3000)     │ ←──────────────────  │  (port 8642)        │
│                     │     SSE chunks     │                  │    SSE passthrough   │                     │
└─────────────────────┘                    └──────────────────┘                      └─────────────────────┘
        │                                          │
        │ localStorage                             │ .env.local
        │ (conversations, systemPrompt)            │ (HERMES_API_KEY)
        ▼                                          ▼
   Browser storage                          Server-side only
   (never sent to Git)                      (never exposed to browser)
```

**Why a proxy?**
- API Key stays server-side — never exposed to the browser.
- Bypasses Hermes default CORS restrictions.
- Enables future middleware (rate limiting, logging, auth).

---

## ✨ Features

### Core
| Feature | Description |
|---------|-------------|
| **SSE Streaming** | Real-time token-by-token output via `chat.completion.chunk` events |
| **Tool Call Logging** | Captures `hermes.tool.progress` SSE events for tool execution visibility |
| **Agent Status** | Live health check (`/health/detailed`) + capabilities discovery |
| **Model Discovery** | Dynamic model list from `/v1/models` endpoint |
| **Markdown Rendering** | Full GFM support with syntax-highlighted code blocks + copy button |

### Conversation Management
| Feature | Description |
|---------|-------------|
| **Auto-save** | Conversations are automatically saved after each exchange |
| **Fresh Start** | Every page load starts with a clean session |
| **History Drawer** | Hamburger menu (☰) opens a slide-out panel with all saved sessions |
| **Restore** | Click any session to fully restore messages + tool events + system prompt |
| **Rename / Delete** | Inline rename and delete for each saved session |
| **Max 50 Sessions** | Oldest sessions are automatically pruned |

### UI / UX
| Feature | Description |
|---------|-------------|
| **Terminal Aesthetic** | Dark void background, gold/amber Hermes branding, CRT scanlines |
| **ASCII Art Logo** | Golden glowing pixel-art HERMES logo |
| **System Prompt** | Collapsible editor (SYS button) to customize system instructions |
| **Status Bar** | VS Code-style bottom bar: connection, model, sessions, msg/tool/token counts, clock |
| **Keyboard Shortcuts** | `Ctrl+L` clear, `Ctrl+N` new session, `Esc` close drawer |
| **Example Prompts** | Clickable `$ ...` cards on empty state to quick-start a conversation |

---

## 📁 Project Structure

```
hermes_gui/
├── apps/
│   ├── proxy/                          # Next.js API Proxy (port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/hermes/
│   │   │   │   │   ├── chat/route.ts       # POST → /v1/chat/completions (SSE passthrough)
│   │   │   │   │   ├── health/route.ts     # GET  → /health/detailed (fallback /health)
│   │   │   │   │   ├── capabilities/route.ts # GET → /capabilities
│   │   │   │   │   └── models/route.ts     # GET  → /v1/models
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── lib/
│   │   │       └── hermes.ts               # Auth headers, URL builder, CORS helpers
│   │   ├── .env.local.example
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── web/                            # React + Vite Frontend (port 5600)
│       ├── src/
│       │   ├── components/
│       │   │   ├── AgentPanel.tsx           # Agent status, model list, capabilities
│       │   │   ├── ChatHeader.tsx           # Logo, status badges, actions, drawer toggle
│       │   │   ├── ChatInput.tsx            # Message input with terminal styling
│       │   │   ├── ConversationDrawer.tsx   # Session history slide-out panel
│       │   │   ├── MarkdownContent.tsx      # react-markdown + Prism syntax highlighting
│       │   │   ├── MessageList.tsx          # Chat messages, ASCII logo, example prompts
│       │   │   ├── StatusBar.tsx            # Bottom status bar
│       │   │   └── ToolLogPanel.tsx         # Tool execution event log
│       │   ├── stores/
│       │   │   └── chatStore.ts            # Zustand store: chat, sessions, SSE parsing
│       │   ├── lib/
│       │   │   ├── api.ts                  # Proxy URL builder
│       │   │   └── cn.ts                   # Class name utility
│       │   ├── App.tsx                     # Root layout
│       │   ├── main.tsx                    # Entry point
│       │   └── styles.css                  # Global styles, CRT effects, terminal panels
│       ├── index.html
│       ├── tailwind.config.ts
│       ├── vite.config.ts
│       └── package.json
│
├── .env.example                        # Root env template
├── .gitignore
├── package.json                        # Workspace root (npm workspaces)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Hermes Agent** installed and configured ([docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server))

### 1. Start Hermes API Server

```bash
hermes gateway
# Default: http://localhost:8642
```

### 2. Clone & Install

```bash
git clone https://github.com/lastrei/hermes_gui.git
cd hermes_gui
npm install
```

### 3. Configure Environment

```bash
# Copy the example and fill in your API key
cp apps/proxy/.env.local.example apps/proxy/.env.local
```

Edit `apps/proxy/.env.local`:

```env
HERMES_API_BASE_URL=http://localhost:8642
HERMES_API_KEY=your-hermes-api-key-here
HERMES_MODEL=hermes-agent
PROXY_CORS_ORIGIN=http://localhost:5600
```

### 4. Start Development Servers

```bash
# Start both proxy and frontend simultaneously
npm run dev

# Or start individually:
npm run dev:proxy   # Next.js proxy → http://localhost:3000
npm run dev:web     # Vite frontend → http://127.0.0.1:5600
```

### 5. Open Browser

Navigate to **http://localhost:5600** — you should see the terminal UI with `ONLINE` status.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in input |
| `Ctrl + L` | Clear current session |
| `Ctrl + N` | New conversation (auto-saves current) |
| `Esc` | Close conversation drawer |

---

## 🔌 Proxy API Endpoints

All endpoints are served by the Next.js proxy at `http://localhost:3000`:

| Method | Endpoint | Upstream | Description |
|--------|----------|----------|-------------|
| `POST` | `/api/hermes/chat` | `/v1/chat/completions` | Chat completions with SSE streaming. Auto-injects Bearer token, forces `stream: true`. |
| `GET` | `/api/hermes/health` | `/health/detailed` → `/health` | Agent health check with detailed fallback. |
| `GET` | `/api/hermes/capabilities` | `/capabilities` | Agent feature flags and platform info. |
| `GET` | `/api/hermes/models` | `/v1/models` | Available model list. |

---

## 💾 Data Storage

| Data | Storage | Persistence |
|------|---------|-------------|
| Conversation history | Browser `localStorage` | Survives refresh, cleared on browser data wipe |
| Tool event logs | Browser `localStorage` (per session) | Restored with session |
| System prompt | Browser `localStorage` | Persists across sessions |
| API Key | `apps/proxy/.env.local` (server-only) | Never sent to browser |

> **Note:** Conversation data is stored exclusively in the browser. It is **not** sent to any server and is **not** tracked by Git.

---

## 🔒 Security Notes

- **API Key** is injected server-side by the Next.js proxy. The browser never sees it.
- `.env.local` files are git-ignored by default (`.env.*` rule in `.gitignore`).
- If Hermes is bound to a non-loopback address, use a strong API key and restrict network access.
- The proxy adds `Authorization: Bearer <key>` to every upstream request.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6 |
| State | Zustand 5 (with `persist` middleware) |
| Styling | Tailwind CSS 3, custom terminal theme |
| Markdown | react-markdown, remark-gfm, react-syntax-highlighter |
| Icons | Lucide React |
| Proxy | Next.js 15 Route Handlers |
| Protocol | OpenAI-compatible Chat Completions, SSE |

---

## 📄 License

MIT
