import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Tool, Task, RoutingSuggestion } from '@remote-app/shared';

interface CreateTaskResponse {
  task: Task;
  suggestion: RoutingSuggestion;
}

interface ToolsResponse {
  tools: Tool[];
}

interface TasksResponse {
  tasks: Task[];
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async (): Promise<Tool[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTools() as { success: boolean; data?: ToolsResponse };
      return data.data?.tools ?? [];
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
      const data = await api.getTasks() as { success: boolean; data?: TasksResponse };
      return data.data?.tasks ?? [];
    } catch {
      setError('Failed to fetch tasks');
      return [];
    } finally {
      setLoading(false);
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

  return { loading, error, fetchTools, fetchTasks, createTask, confirmTask, cancelTask };
}
