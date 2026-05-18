import type { RoutingSuggestion } from '@remote-app/shared'
import { getAllTools } from '../db/repositories/tools.js'
import { llmService } from './llm.js'
import { getPreferencesInstance } from '../routes/preferences.js'

// ─── Keyword-based fallback router ───────────────────────────────────────────

const KEYWORD_MAP: Record<string, string[]> = {
  'antigravity': ['design', 'ui', 'frontend', 'react', 'javascript', 'typescript', 'css', 'html', 'component', 'vibe', 'prototype', 'coding', 'architecture', 'codebase', 'debug'],
  'codex': ['python', 'script', 'data', 'ml', 'machine learning', 'automation', 'cli', 'refactor', 'generate', 'quick'],
  'kiro': ['aws', 'cloud', 'infrastructure', 'terraform', 'serverless', 'lambda', 'deploy', 'full-stack', 'fullstack'],
  'claude-code': ['refactor', 'review', 'typescript', 'javascript', 'documentation', 'code review', 'fix bug', 'optimize'],
  'hermes': ['research', 'search', 'find', 'analyze', 'summarize', 'explain', 'document', 'data analysis'],
  'openclaw': ['chat', 'agent', 'workflow', 'automate', 'schedule', 'telegram', 'message', 'multi-step', 'file management'],
}

const REASONS: Record<string, string> = {
  'antigravity': 'Task liên quan đến coding/architecture/debugging phức tạp — Antigravity phù hợp nhất',
  'codex': 'Task liên quan đến code generation/refactoring nhanh — Codex phù hợp nhất',
  'kiro': 'Task liên quan đến AWS/cloud/full-stack — Kiro phù hợp nhất',
  'claude-code': 'Task liên quan đến TypeScript/JavaScript/code review — Claude Code phù hợp nhất',
  'hermes': 'Task liên quan đến research/data analysis — Hermes phù hợp nhất',
  'openclaw': 'Task đa năng hoặc multi-step workflow — OpenClaw là lựa chọn mặc định',
}

function keywordRoute(prompt: string): RoutingSuggestion {
  const lower = prompt.toLowerCase()
  const tools = getAllTools()
  const scores: Record<string, number> = {}

  for (const [toolId, keywords] of Object.entries(KEYWORD_MAP)) {
    scores[toolId] = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[toolId] += 1
    }
  }

  let bestToolId = 'openclaw'
  let bestScore = 0
  for (const [toolId, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestToolId = toolId }
  }

  const tool = tools.find(t => t.id === bestToolId || t.name.toLowerCase().includes(bestToolId))
    ?? tools.find(t => t.name.toLowerCase().includes('openclaw'))
    ?? tools[0]

  const confidence = bestScore === 0 ? 0.4 : Math.min(0.95, 0.5 + bestScore * 0.15)

  return {
    toolId: tool?.id ?? bestToolId,
    confidence,
    reason: REASONS[bestToolId] ?? 'OpenClaw là lựa chọn mặc định',
  }
}

// ─── LLM-based router ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI task router. Given a user's task description, recommend the best AI tool to handle it.

Available tools:
- openclaw: Multi-agent AI assistant. Best for: chat, automation, multi-step workflows, research, file management
- hermes: Python-based AI agent. Best for: Python scripts, data analysis, automation, research
- kiro: AWS AI IDE. Best for: AWS services, cloud development, full-stack apps
- antigravity: Google coding agent. Best for: complex coding, architecture, debugging, large codebases
- codex: OpenAI coding CLI. Best for: quick code generation, refactoring, CLI tools
- claude-code: Anthropic coding CLI. Best for: TypeScript/JavaScript, code review, documentation

Respond in JSON format only, no markdown, no explanation outside JSON:
{
  "toolId": "tool-id",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation why this tool is best for the task"
}`

async function llmRoute(prompt: string): Promise<RoutingSuggestion | null> {
  try {
    const tools = getAllTools()
    const response = await llmService.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Task: ${prompt}` },
    ], { maxTokens: 200, temperature: 0.1 })

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[router] LLM response not parseable:', response)
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      toolId: string
      confidence: number
      reason: string
    }

    if (!parsed.toolId || typeof parsed.confidence !== 'number') {
      console.warn('[router] LLM response missing fields:', parsed)
      return null
    }

    const tool = tools.find(t => t.id === parsed.toolId || t.name.toLowerCase().includes(parsed.toolId))
    if (!tool) {
      console.warn('[router] LLM suggested unknown tool:', parsed.toolId)
      return null
    }

    console.log(`[router] LLM routed to ${parsed.toolId} (confidence: ${parsed.confidence})`)
    return {
      toolId: tool.id,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      reason: parsed.reason,
    }
  } catch (err) {
    console.warn('[router] LLM routing failed, falling back to keyword:', (err as Error).message)
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function routeTask(prompt: string): Promise<RoutingSuggestion> {
  const prefs = getPreferencesInstance()

  // If defaultTool is set → always use it (confidence 1.0)
  if (prefs.defaultTool) {
    const tools = getAllTools()
    const tool = tools.find(t => t.id === prefs.defaultTool)
    if (tool) {
      console.log(`[router] Using defaultTool from preferences: ${prefs.defaultTool}`)
      return {
        toolId: tool.id,
        confidence: 1.0,
        reason: `Đang dùng tool mặc định: ${tool.name}`,
      }
    }
  }

  // Try LLM first
  const llmResult = await llmRoute(prompt)
  if (llmResult) return llmResult

  // Fallback to keyword-based
  console.log('[router] Using keyword-based fallback')
  return keywordRoute(prompt)
}

// Sync version for backward compat (keyword only)
export function routeTaskSync(prompt: string): RoutingSuggestion {
  return keywordRoute(prompt)
}
