// ─── Prompt Composer ─────────────────────────────────────────────────────────
// Generates structured prompts for each task based on context.

import type { CodingTask, Project, Goal, Agent, GovernanceRule } from '../types';

interface PromptContext {
  task: CodingTask;
  project: Project;
  goal: Goal;
  agent: Agent;
  relatedFiles?: string[];
}

export function composePrompt(ctx: PromptContext): string {
  const { task, project, goal, agent, relatedFiles } = ctx;

  const enabledRules = project.governanceRules.filter((r) => r.enabled);

  const sections = [
    `# Role`,
    `You are ${agent.name}, an AI coding agent specialized in: ${agent.strengths.join(', ')}.`,
    ``,
    `# Context`,
    `- Project: ${project.name}`,
    `- Tech Stack: ${project.techStack.join(', ')}`,
    `- Project Path: ${project.path}`,
    `- Goal: ${goal.title}`,
    ``,
    `# Task Objective`,
    `${task.title}`,
    ``,
    `# Description`,
    `${task.description}`,
    ``,
    `# Requirements`,
    `- Task Type: ${task.type}`,
    `- Priority: ${task.priority}`,
    `- Complexity: ${task.estimatedComplexity}`,
    ``,
    `# Constraints`,
    `- Work only within the scope of this task`,
    `- Follow the project's existing code style and patterns`,
    `- Do not modify files outside the task scope`,
    ``,
  ];

  // Governance Rules
  if (enabledRules.length > 0) {
    sections.push(`# Governance Rules`);
    enabledRules.forEach((rule, i) => {
      sections.push(`${i + 1}. ${rule.text}`);
    });
    sections.push(``);
  }

  // Related Files
  if (relatedFiles?.length) {
    sections.push(`# Related Files`);
    relatedFiles.forEach((f) => sections.push(`- ${f}`));
    sections.push(``);
  }

  // Expected Output
  sections.push(
    `# Expected Output`,
    `- Working code that fulfills the task objective`,
    `- List of files created or modified`,
    `- Brief summary of what was done`,
    ``,
    `# Definition of Done`,
    `- Code compiles without errors`,
    `- Follows project conventions`,
    `- Task objective is fully met`,
    `- Summary provided`,
  );

  return sections.join('\n');
}

/**
 * Generate prompt and attach to task
 */
export function generateTaskPrompt(
  task: CodingTask,
  project: Project,
  goal: Goal,
  agents: Agent[]
): string {
  const agent = agents.find((a) => a.id === task.assignedAgentId);
  if (!agent) return `[ERROR] No agent assigned to task: ${task.title}`;

  return composePrompt({ task, project, goal, agent });
}
