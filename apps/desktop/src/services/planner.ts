// ─── Task Planner ────────────────────────────────────────────────────────────
// Rule-based planner that breaks goals into epics and tasks.
// Designed to be replaceable with LLM-based planner later.

import type { Goal, Project, Plan, Epic, CodingTask, TaskType, TaskPriority } from '../types';
import { routeTask } from './router';

interface PlanResult {
  plan: Plan;
  tasks: CodingTask[];
}

export function planGoal(goal: Goal, project: Project): PlanResult {
  const lower = goal.description.toLowerCase();
  const epics: Epic[] = [];
  const allTasks: CodingTask[] = [];
  let epicOrder = 0;

  // ─── Detect what's needed based on keywords ────────────────────────────

  const needsSetup = true; // always
  const needsFrontend = /react|frontend|ui|component|page|screen|desktop|web/.test(lower);
  const needsBackend = /api|backend|server|endpoint|rest|graphql/.test(lower);
  const needsDatabase = /database|db|sqlite|postgres|mongo|storage|schema/.test(lower);
  const needsAuth = /auth|login|register|permission|role/.test(lower);
  const needsTesting = /test|spec|coverage/.test(lower) || true; // always include basic testing
  const needsDocs = true; // always
  const needsDevops = /deploy|docker|ci|cd|pipeline|infra/.test(lower);

  // ─── Epic: Project Setup ───────────────────────────────────────────────

  if (needsSetup) {
    const epic = createEpic(`epic-${Date.now()}-0`, goal.id, 'Project Setup', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Initialize project structure', 'architecture', 'high', 'low'),
      createTask(epic.id, 'Configure build tools and dependencies', 'automation', 'high', 'low'),
      createTask(epic.id, 'Setup linting and formatting', 'automation', 'medium', 'low'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: Architecture ────────────────────────────────────────────────

  {
    const epic = createEpic(`epic-${Date.now()}-1`, goal.id, 'Architecture & Design', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Design system architecture', 'architecture', 'critical', 'high'),
      createTask(epic.id, 'Define data models and types', 'architecture', 'high', 'medium'),
      createTask(epic.id, 'Plan folder structure and modules', 'planning', 'high', 'low'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: Backend ─────────────────────────────────────────────────────

  if (needsBackend) {
    const epic = createEpic(`epic-${Date.now()}-2`, goal.id, 'Backend Development', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Create API server scaffold', 'backend', 'high', 'medium'),
      createTask(epic.id, 'Implement core API endpoints', 'backend', 'high', 'high'),
      createTask(epic.id, 'Add error handling and validation', 'backend', 'medium', 'medium'),
    ];
    if (needsAuth) {
      tasks.push(createTask(epic.id, 'Implement authentication system', 'backend', 'high', 'high'));
    }
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: Database ────────────────────────────────────────────────────

  if (needsDatabase) {
    const epic = createEpic(`epic-${Date.now()}-3`, goal.id, 'Database Layer', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Design database schema', 'database', 'high', 'medium'),
      createTask(epic.id, 'Implement data access layer', 'database', 'high', 'medium'),
      createTask(epic.id, 'Create seed data and migrations', 'database', 'medium', 'low'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: Frontend ────────────────────────────────────────────────────

  if (needsFrontend) {
    const epic = createEpic(`epic-${Date.now()}-4`, goal.id, 'Frontend Development', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Create main layout and navigation', 'frontend', 'high', 'medium'),
      createTask(epic.id, 'Build core UI components', 'frontend', 'high', 'high'),
      createTask(epic.id, 'Implement main screens/pages', 'frontend', 'high', 'high'),
      createTask(epic.id, 'Add state management', 'frontend', 'medium', 'medium'),
      createTask(epic.id, 'Polish UI and add animations', 'frontend', 'low', 'medium'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: Testing ─────────────────────────────────────────────────────

  if (needsTesting) {
    const epic = createEpic(`epic-${Date.now()}-5`, goal.id, 'Testing', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Setup test framework', 'testing', 'medium', 'low'),
      createTask(epic.id, 'Write unit tests for core logic', 'testing', 'medium', 'medium'),
      createTask(epic.id, 'Write integration tests', 'testing', 'medium', 'high'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: DevOps ──────────────────────────────────────────────────────

  if (needsDevops) {
    const epic = createEpic(`epic-${Date.now()}-6`, goal.id, 'DevOps & Deployment', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Setup CI/CD pipeline', 'devops', 'medium', 'medium'),
      createTask(epic.id, 'Configure deployment', 'devops', 'medium', 'medium'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Epic: Documentation ───────────────────────────────────────────────

  if (needsDocs) {
    const epic = createEpic(`epic-${Date.now()}-7`, goal.id, 'Documentation & Review', epicOrder++);
    const tasks = [
      createTask(epic.id, 'Write README and setup guide', 'documentation', 'medium', 'low'),
      createTask(epic.id, 'Final code review', 'review', 'high', 'medium'),
    ];
    epic.tasks = tasks;
    epics.push(epic);
    allTasks.push(...tasks);
  }

  // ─── Assign agents to all tasks ───────────────────────────────────────

  allTasks.forEach((task) => {
    task.assignedAgentId = routeTask(task.type);
  });

  // ─── Build plan ────────────────────────────────────────────────────────

  const plan: Plan = {
    id: `plan-${Date.now()}`,
    goalId: goal.id,
    status: 'draft',
    epics,
    createdAt: new Date().toISOString(),
  };

  return { plan, tasks: allTasks };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createEpic(id: string, planId: string, title: string, order: number): Epic {
  return { id, planId, title, description: title, order, tasks: [] };
}

let taskCounter = 0;
function createTask(
  epicId: string,
  title: string,
  type: TaskType,
  priority: TaskPriority,
  complexity: 'low' | 'medium' | 'high'
): CodingTask {
  return {
    id: `task-${Date.now()}-${++taskCounter}`,
    epicId,
    title,
    description: title,
    type,
    priority,
    status: 'backlog',
    dependencies: [],
    estimatedComplexity: complexity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
