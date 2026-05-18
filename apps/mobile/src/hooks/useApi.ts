import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Tool, Task } from '@remote-app/shared';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async (): Promise<Tool[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTools();
      return data.tools ?? [];
    } catch (e) {
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
      const data = await api.getTasks();
      return data.tasks ?? [];
    } catch (e) {
      setError('Failed to fetch tasks');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.createTask(prompt);
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      setError('Failed to cancel task');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchTools, fetchTasks, createTask, confirmTask, cancelTask };
}
