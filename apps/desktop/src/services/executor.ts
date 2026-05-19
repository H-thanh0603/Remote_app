// ─── Execution Manager ───────────────────────────────────────────────────────
// Handles running tasks via agents. Mock execution for MVP.
// Architecture ready for real terminal execution via child_process.

import type { CodingTask, RunSession } from '../types';
import { useRunStore, useAgentStore } from '../stores';

/**
 * Execute a task. Currently mock — will be replaced with real CLI execution.
 */
export async function executeTask(task: CodingTask): Promise<void> {
  const agent = useAgentStore.getState().getAgentById(task.assignedAgentId ?? '');
  if (!agent) throw new Error(`No agent assigned to task: ${task.title}`);

  const session: RunSession = {
    id: `run-${Date.now()}`,
    taskId: task.id,
    agentId: agent.id,
    command: agent.type === 'terminal' ? `${agent.command} "${task.prompt || task.description}"` : `[API] ${agent.name}`,
    status: 'running',
    logs: [],
    startedAt: new Date().toISOString(),
  };

  useRunStore.getState().addSession(session);

  // ─── Mock Execution ────────────────────────────────────────────────────
  // Simulates agent working on the task with realistic delays and logs.
  // Replace this block with real child_process.spawn() later.

  const mockLogs = [
    `[${agent.name}] Starting task: ${task.title}`,
    `[${agent.name}] Analyzing requirements...`,
    `[${agent.name}] Working on ${task.type} task (complexity: ${task.estimatedComplexity})...`,
    `[${agent.name}] Generating code...`,
    `[${agent.name}] Writing files...`,
    `[${agent.name}] Verifying output...`,
    `[${agent.name}] ✅ Task completed successfully.`,
    `[${agent.name}] Files modified: src/${task.type}/${task.id.slice(-6)}.ts`,
    `[${agent.name}] Summary: Implemented "${task.title}" as requested.`,
  ];

  for (const log of mockLogs) {
    await delay(300 + Math.random() * 700);
    useRunStore.getState().appendLog(session.id, log);
  }

  // Complete
  useRunStore.getState().updateSession(session.id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - new Date(session.startedAt).getTime(),
    output: `Task "${task.title}" completed by ${agent.name}`,
  });
}

/**
 * Stop a running task (mock)
 */
export function stopTask(sessionId: string): void {
  useRunStore.getState().updateSession(sessionId, {
    status: 'stopped',
    completedAt: new Date().toISOString(),
  });
  useRunStore.getState().appendLog(sessionId, '[System] Task stopped by user.');
}

// ─── Real Execution (placeholder) ───────────────────────────────────────────
// TODO: Replace mock with:
// import { spawn } from 'child_process';
//
// function executeReal(agent: Agent, prompt: string): ChildProcess {
//   return spawn(agent.command, [prompt], {
//     cwd: agent.workingDir || undefined,
//     shell: true,
//   });
// }

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
