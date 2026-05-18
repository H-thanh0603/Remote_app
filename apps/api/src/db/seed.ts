import { getDb } from './index.js'
import { upsertTool } from './repositories/tools.js'

const defaultTools = [
  {
    id: 'openclaw',
    name: 'OpenClaw',
    type: 'ai-ide',
    status: 'idle',
    description: 'Multi-agent AI assistant with chat, automation, and coding capabilities',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    type: 'ai-agent',
    status: 'offline',
    description: 'Python-based AI agent for research and automation',
  },
  {
    id: 'kiro',
    name: 'Kiro',
    type: 'ai-ide',
    status: 'offline',
    description: 'AWS AI-powered development environment',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    type: 'ai-coding',
    status: 'offline',
    description: 'Google autonomous coding agent',
  },
  {
    id: 'codex',
    name: 'Codex',
    type: 'ai-cli',
    status: 'offline',
    description: 'OpenAI coding CLI agent',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    type: 'ai-cli',
    status: 'offline',
    description: 'Anthropic coding CLI agent',
  },
]

export function seedDatabase(): void {
  const db = getDb()

  // Check if tools table is empty
  const count = (db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number }).count
  if (count > 0) {
    console.log('⏭️  Database already seeded, skipping...')
    return
  }

  console.log('🌱 Seeding database with default tools...')
  for (const tool of defaultTools) {
    upsertTool(tool)
  }
  console.log(`✅ Seeded ${defaultTools.length} tools`)
}
