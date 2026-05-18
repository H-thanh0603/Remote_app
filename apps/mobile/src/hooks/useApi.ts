import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Tool, Task, RoutingSuggestion } from '@remote-app/shared';

interface CreateTaskResponse {
  task: Task;
  suggestion: RoutingSuggestion;
  autoConfirmed?: boolean;
}

interface SearchTasksParams {
  limit?: number;
  offset?: number;
  status?: string;
  tool?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
}

interface SearchTasksResult {
  tasks: Task[];
  total: number;
}

interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  byTool: Record<string, number>;
  avgDuration: number;
}

interface UserPreferences {
  defaultTool: string | null;
  autoConfirm: boolean;
  autoConfirmThreshold: number;
  theme: 'dark' | 'light';
  language: 'en' | 'vi';
  showTokenUsage: boolean;
  showDuration: boolean;
  telegramEnabled: boolean;
  notifyOnComplete: boolean;
  notifyOnFail: boolean;
  notifyOnToolError: boolean;
  historyRetentionDays: number;
  autoDeleteOldTasks: boolean;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async (): Promise<Tool[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTools() as { success: boolean; data?: Tool[] };
      return data.data ?? [];
    } catch {
      setError('Failed to fetch tools');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks() as { success: boolean; data?: { tasks: Task[] } };
      return data.data?.tasks ?? [];
    } catch {
      setError('Failed to fetch tasks');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTasks = useCallback(async (params: SearchTasksParams): Promise<SearchTasksResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      if (params.status) query.set('status', params.status);
      if (params.tool) query.set('tool', params.tool);
      if (params.search) query.set('search', params.search);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.sort) query.set('sort', params.sort);
      const data = await api.get(`/tasks?${query.toString()}`) as { success: boolean; data?: SearchTasksResult };
      return data.data ?? null;
    } catch {
      setError('Failed to search tasks');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskStats = useCallback(async (): Promise<TaskStats | null> => {
    try {
      const data = await api.get('/tasks/stats') as { success: boolean; data?: TaskStats };
      return data.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const createTask = useCallback(async (prompt: string): Promise<CreateTaskResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createTask(prompt) as { success: boolean; data?: CreateTaskResponse };
      return res.data ?? null;
    } catch {
      setError('Failed to create task');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmTask = useCallback(async (taskId: string, toolId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.confirmTask(taskId, toolId);
    } catch {
      setError('Failed to confirm task');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.cancelTask(taskId);
    } catch {
      setError('Failed to cancel task');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    try {
      const data = await api.get('/preferences') as { success: boolean; data?: UserPreferences };
      return data.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const updatePreference = useCallback(async (key: string, value: unknown): Promise<UserPreferences | null> => {
    try {
      const data = await api.put('/preferences', { key, value }) as { success: boolean; data?: UserPreferences };
      return data.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const resetPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    try {
      const data = await api.post('/preferences/reset', {}) as { success: boolean; data?: UserPreferences };
      return data.data ?? null;
    } catch {
      return null;
    }
  }, []);

  return {
    loading,
    error,
    fetchTools,
    fetchTasks,
    searchTasks,
    getTaskStats,
    createTask,
    confirmTask,
    cancelTask,
    getPreferences,
    updatePreference,
    resetPreferences,
  };
}
