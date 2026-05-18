import type { RoutingSuggestion } from '@remote-app/shared'
import { getAllTools } from '../db/repositories/tools.js'

const KEYWORD_MAP: Record<string, string[]> = {
  'antigravity': ['design', 'ui', 'frontend', 'react', 'javascript', 'typescript', 'css', 'html', 'component', 'vibe', 'prototype'],
  'codex': ['python', 'script', 'data', 'ml', 'machine learning', 'automation', 'cli'],
  'kiro': ['aws', 'cloud', 'infrastructure', 'terraform', 'serverless', 'lambda', 'deploy'],
  'claude-code': ['refactor', 'review', 'architecture', 'debug', 'fix bug', 'optimize', 'test'],
  'hermes': ['research', 'search', 'find', 'analyze', 'summarize', 'explain', 'document'],
  'openclaw': ['chat', 'agent', 'workflow', 'automate', 'schedule', 'telegram', 'message'],
}

export function routeTask(prompt: string): RoutingSuggestion {
  const lower = prompt.toLowerCase()
  const tools = getAllTools()

  const scores: Record<string, number> = {}

  for (const [toolId, keywords] of Object.entries(KEYWORD_MAP)) {
    scores[toolId] = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[toolId] += 1
      }
    }
  }

  // Find best match
  let bestToolId = 'openclaw'
  let bestScore = 0

  for (const [toolId, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestToolId = toolId
    }
  }

  // Find tool in DB (match by id or name)
  const tool = tools.find(
    t => t.id === bestToolId || t.name.toLowerCase().includes(bestToolId)
  ) ?? tools.find(t => t.name.toLowerCase().includes('openclaw')) ?? tools[0]

  const confidence = bestScore === 0 ? 0.4 : Math.min(0.95, 0.5 + bestScore * 0.15)

  const reasons: Record<string, string> = {
    'antigravity': 'Task liên quan đến UI/frontend/JavaScript — Antigravity phù hợp nhất',
    'codex': 'Task liên quan đến Python/scripting/data — Codex phù hợp nhất',
    'kiro': 'Task liên quan đến AWS/cloud/infrastructure — Kiro phù hợp nhất',
    'claude-code': 'Task liên quan đến refactor/review/debug — Claude Code phù hợp nhất',
    'hermes': 'Task liên quan đến research/search/analysis — Hermes phù hợp nhất',
    'openclaw': 'Task đa năng hoặc không rõ loại — OpenClaw là lựa chọn mặc định',
  }

  return {
    toolId: tool?.id ?? bestToolId,
    confidence,
    reason: reasons[bestToolId] ?? 'OpenClaw là lựa chọn mặc định',
  }
}
