import { create } from 'zustand';
import type { Project, Agent, Goal, Plan, CodingTask, RunSession, Toast, ActivityItem } from '../types';
import { seedAgents, seedProject, seedGoal } from '../data/seed';

// ─── Project Store ───────────────────────────────────────────────────────────

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  getActiveProject: () => Project | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [seedProject],
  activeProjectId: seedProject.id,
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (id, data) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)),
    })),
  deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
  setActiveProject: (id) => set({ activeProjectId: id }),
  getActiveProject: () => get().projects.find((p) => p.id === get().activeProjectId),
}));

// ─── Agent Store ─────────────────────────────────────────────────────────────

interface AgentStore {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, data: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  getAgentById: (id: string) => Agent | undefined;
  getOnlineAgents: () => Agent[];
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: seedAgents,
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, data) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
  deleteAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  getAgentById: (id) => get().agents.find((a) => a.id === id),
  getOnlineAgents: () => get().agents.filter((a) => a.status === 'online'),
}));

// ─── Goal Store ──────────────────────────────────────────────────────────────

interface GoalStore {
  goals: Goal[];
  plans: Plan[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, data: Partial<Plan>) => void;
  getPlanByGoalId: (goalId: string) => Plan | undefined;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [seedGoal],
  plans: [],
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  updateGoal: (id, data) =>
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data, updatedAt: new Date().toISOString() } : g)) })),
  deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
  addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),
  updatePlan: (id, data) =>
    set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
  getPlanByGoalId: (goalId) => get().plans.find((p) => p.goalId === goalId),
}));

// ─── Task Store ──────────────────────────────────────────────────────────────

interface TaskStore {
  tasks: CodingTask[];
  addTask: (task: CodingTask) => void;
  addTasks: (tasks: CodingTask[]) => void;
  updateTask: (id: string, data: Partial<CodingTask>) => void;
  deleteTask: (id: string) => void;
  getTasksByStatus: (status: CodingTask['status']) => CodingTask[];
  getTasksByEpic: (epicId: string) => CodingTask[];
  getRunningTasks: () => CodingTask[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  addTasks: (tasks) => set((s) => ({ tasks: [...s.tasks, ...tasks] })),
  updateTask: (id, data) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t)) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
  getTasksByEpic: (epicId) => get().tasks.filter((t) => t.epicId === epicId),
  getRunningTasks: () => get().tasks.filter((t) => t.status === 'running'),
}));

// ─── Run Session Store ───────────────────────────────────────────────────────

interface RunStore {
  sessions: RunSession[];
  addSession: (session: RunSession) => void;
  updateSession: (id: string, data: Partial<RunSession>) => void;
  appendLog: (id: string, log: string) => void;
  getSessionByTaskId: (taskId: string) => RunSession | undefined;
}

export const useRunStore = create<RunStore>((set, get) => ({
  sessions: [],
  addSession: (session) => set((s) => ({ sessions: [...s.sessions, session] })),
  updateSession: (id, data) =>
    set((s) => ({ sessions: s.sessions.map((r) => (r.id === id ? { ...r, ...data } : r)) })),
  appendLog: (id, log) =>
    set((s) => ({
      sessions: s.sessions.map((r) => (r.id === id ? { ...r, logs: [...r.logs, log] } : r)),
    })),
  getSessionByTaskId: (taskId) => get().sessions.find((r) => r.taskId === taskId),
}));

// ─── UI Store ────────────────────────────────────────────────────────────────

interface UIStore {
  sidebarCollapsed: boolean;
  toasts: Toast[];
  activities: ActivityItem[];
  toggleSidebar: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toasts: [],
  activities: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  addToast: (toast) =>
    set((s) => ({ toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  addActivity: (activity) =>
    set((s) => ({
      activities: [
        { ...activity, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
        ...s.activities.slice(0, 49),
      ],
    })),
}));
