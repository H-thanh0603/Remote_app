// ─── Core Data Types ─────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  techStack: string[];
  governanceRules: GovernanceRule[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'terminal' | 'api' | 'manual';
  command: string;
  workingDir: string;
  description: string;
  strengths: string[];
  supportedTaskTypes: TaskType[];
  maxConcurrentTasks: number;
  reliabilityScore: number;
  status: 'online' | 'offline' | 'error';
  createdAt: string;
}

export type GoalStatus = 'draft' | 'planned' | 'approved' | 'running' | 'completed' | 'failed';
export type PlanStatus = 'draft' | 'approved' | 'running' | 'completed';
export type TaskStatus = 'backlog' | 'ready' | 'running' | 'review' | 'done' | 'failed';
export type TaskType =
  | 'planning'
  | 'architecture'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'testing'
  | 'debugging'
  | 'review'
  | 'documentation'
  | 'automation'
  | 'devops';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Goal {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: GoalStatus;
  planId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  goalId: string;
  status: PlanStatus;
  epics: Epic[];
  createdAt: string;
  approvedAt?: string;
}

export interface Epic {
  id: string;
  planId: string;
  title: string;
  description: string;
  order: number;
  tasks: CodingTask[];
}

export interface CodingTask {
  id: string;
  epicId: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgentId?: string;
  dependencies: string[]; // task ids
  estimatedComplexity: 'low' | 'medium' | 'high';
  prompt?: string;
  runSessionId?: string;
  reviewResult?: ReviewResult;
  createdAt: string;
  updatedAt: string;
}

export interface RunSession {
  id: string;
  taskId: string;
  agentId: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  logs: string[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  output?: string;
  error?: string;
}

export interface ReviewResult {
  id: string;
  taskId: string;
  reviewerAgentId: string;
  meetsRequirements: number; // 1-10
  codeQuality: number; // 1-10
  potentialIssues: string[];
  needsRetry: boolean;
  summary: string;
  createdAt: string;
}

export interface GovernanceRule {
  id: string;
  text: string;
  enabled: boolean;
}

// ─── UI Types ────────────────────────────────────────────────────────────────

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface ActivityItem {
  id: string;
  type: 'goal_created' | 'plan_generated' | 'task_assigned' | 'task_completed' | 'task_failed' | 'review_completed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
