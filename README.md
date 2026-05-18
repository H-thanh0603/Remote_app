# AI Command Center

> Chat-first app để điều phối các AI tools: OpenClaw, Hermes, Kiro, Antigravity, Codex, Claude Code.

## Overview

AI Command Center cho phép bạn:
- Gõ task vào 1 ô chat duy nhất
- AI tự phân tích và gợi ý tool phù hợp nhất
- Xem status real-time của tất cả AI tools
- Nhận thông báo kết quả qua Telegram

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Mobile App (Expo)                   │
│  ChatScreen │ StatusScreen │ HistoryScreen │ Settings│
└──────────────────────┬──────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────┐
│                  API Server (Fastify)                 │
│  Router │ Tasks │ Tools │ Settings │ Notifications   │
├─────────────────────────────────────────────────────┤
│  LLM Router (9router) │ Execution Engine │ SQLite    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              AI Tools                                 │
│  OpenClaw │ Hermes │ Kiro │ Antigravity │ Codex      │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) + TypeScript |
| Backend | Fastify + TypeScript |
| Database | SQLite (better-sqlite3) |
| Real-time | WebSocket (@fastify/websocket) |
| AI Router | LLM-based (OpenAI-compatible) + keyword fallback |
| Notifications | Telegram Bot API |
| Monorepo | npm workspaces |

## Prerequisites

- Node.js >= 22
- npm >= 10
- Expo CLI (`npm install -g expo-cli`)
- An OpenAI-compatible LLM endpoint (e.g. 9router)

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/H-thanh0603/Remote_app.git
cd Remote_app
npm install
```

### 2. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
# LLM Router (required for smart routing)
LLM_BASE_URL=http://127.0.0.1:20128/v1
LLM_API_KEY=your-api-key
LLM_MODEL=kr/claude-sonnet-4.6

# Telegram notifications (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Server
PORT=3001
NODE_ENV=development
```

### 3. Run

**Backend:**
```bash
cd apps/api
npm run dev
```

**Mobile:**
```bash
cd apps/mobile
npx expo start
```

## API Documentation

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

### Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tools` | List all AI tools |
| GET | `/api/tools/:id` | Get tool details |
| PUT | `/api/tools/:id/status` | Update tool status |
| GET | `/api/tools/:id/health` | Check tool health |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task + get routing suggestion |
| GET | `/api/tasks` | List recent tasks |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id/confirm` | Confirm tool + start execution |
| PUT | `/api/tasks/:id/cancel` | Cancel task |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings` | Update a setting |
| POST | `/api/settings/validate` | Test LLM + Telegram connections |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `initial_state` | Server → Client | Tools + recent tasks on connect |
| `task:created` | Server → Client | New task created |
| `task:routing_suggested` | Server → Client | Routing suggestion ready |
| `task:confirmed` | Server → Client | Task confirmed |
| `task:completed` | Server → Client | Task execution done |
| `task:failed` | Server → Client | Task failed |
| `tool:status_changed` | Server → Client | Tool status update |

## Screenshots

> Coming soon — app UI screenshots

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `NOT_FOUND` | 404 | Resource not found |
| `TOOL_UNAVAILABLE` | 503 | AI tool offline |
| `EXECUTION_TIMEOUT` | 408 | Task timed out |
| `LLM_ERROR` | 502 | LLM service error |
| `INTERNAL_ERROR` | 500 | Server error |

## Development Workflow

This project uses a multi-agent development workflow:

```
planner → coding → reviewer → tester → merge
```

Each task is developed on a separate branch (`feat/tXX-description`) and merged to `main` after testing.

## License

MIT
