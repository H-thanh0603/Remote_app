// ─── Agent Router ────────────────────────────────────────────────────────────
// Routes tasks to the best agent based on task type.
// Rule-based for MVP, replaceable with LLM later.

import type { TaskType } from '../types';
import { useAgentStore } from '../stores';

const ROUTING_RULES: Record<TaskType, string[]> = {
  planning: ['claude-code', 'hermes'],
  architecture: ['claude-code', 'antigravity'],
  frontend: ['codex', 'antigravity'],
  backend: ['codex', 'openclaw'],
  database: ['claude-code', 'codex'],
  testing: ['codex', 'openclaw'],
  debugging: ['claude-code', 'antigravity'],
  review: ['claude-code'],
  documentation: ['hermes', 'claude-code'],
  automation: ['openclaw', 'codex'],
  devops: ['openclaw', 'codex'],
};

/**
 * Route a task type to the best available agent.
 * Returns agent id or undefined if no suitable agent found.
 */
export function routeTask(taskType: TaskType): string | undefined {
  const candidates = ROUTING_RULES[taskType] ?? [];
  const agents = useAgentStore.getState().agents;

  // Find first online candidate
  for (const candidateId of candidates) {
    const agent = agents.find((a) => a.id === candidateId);
    if (agent && agent.status === 'online') {
      return agent.id;
    }
  }

  // Fallback: any online agent that supports this task type
  const fallback = agents.find(
    (a) => a.status === 'online' && a.supportedTaskTypes.includes(taskType)
  );
  if (fallback) return fallback.id;

  // No suitable agent
  return undefined;
}

/**
 * Get routing suggestion with reasoning
 */
export function getRoutingSuggestion(taskType: TaskType): { agentId: string | undefined; reason: string } {
  const candidates = ROUTING_RULES[taskType] ?? [];
  const agents = useAgentStore.getState().agents;

  for (const candidateId of candidates) {
    const agent = agents.find((a) => a.id === candidateId);
    if (agent && agent.status === 'online') {
      return {
        agentId: agent.id,
        reason: `${agent.name} is best for ${taskType} tasks (strengths: ${agent.strengths.slice(0, 3).join(', ')})`,
      };
    }
  }

  return { agentId: undefined, reason: `No suitable agent found for ${taskType}` };
}
