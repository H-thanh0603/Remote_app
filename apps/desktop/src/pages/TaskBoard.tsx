import { useTaskStore, useAgentStore, useRunStore, useUIStore } from '../stores';
import { executeTask } from '../services/executor';
import type { TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog', color: 'border-text-muted' },
  { status: 'ready', label: 'Ready', color: 'border-primary' },
  { status: 'running', label: 'Running', color: 'border-warning' },
  { status: 'review', label: 'Review', color: 'border-accent' },
  { status: 'done', label: 'Done', color: 'border-success' },
  { status: 'failed', label: 'Failed', color: 'border-error' },
];

export function TaskBoard() {
  const { tasks, updateTask } = useTaskStore();
  const agents = useAgentStore((s) => s.agents);
  const { addToast, addActivity } = useUIStore();

  const handleRunTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    updateTask(taskId, { status: 'running' });
    addActivity({ type: 'task_assigned', title: 'Task started', description: task.title });

    try {
      await executeTask(task);
      updateTask(taskId, { status: 'review' });
      addToast({ type: 'success', title: 'Task completed', description: task.title });
      addActivity({ type: 'task_completed', title: 'Task completed', description: task.title });
    } catch (err) {
      updateTask(taskId, { status: 'failed' });
      addToast({ type: 'error', title: 'Task failed', description: (err as Error).message });
      addActivity({ type: 'task_failed', title: 'Task failed', description: task.title });
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">Task Board</h1>
        <p className="text-text-secondary text-sm mt-1">Kanban view of all tasks</p>
      </div>

      {/* Kanban */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className={`flex-shrink-0 w-64 flex flex-col bg-surface border-t-2 ${col.color} rounded-lg`}>
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {col.label}
                </span>
                <span className="text-xs bg-background px-1.5 py-0.5 rounded text-text-muted">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colTasks.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">Empty</p>
                ) : (
                  colTasks.map((task) => {
                    const agent = agents.find((a) => a.id === task.assignedAgentId);
                    return (
                      <div key={task.id} className="bg-background border border-border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-medium leading-tight">{task.title}</p>
                          <span className={`ml-2 flex-shrink-0 w-2 h-2 rounded-full ${
                            task.priority === 'critical' ? 'bg-error' :
                            task.priority === 'high' ? 'bg-warning' :
                            task.priority === 'medium' ? 'bg-primary' : 'bg-text-muted'
                          }`} />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 text-[10px] bg-accent/10 text-accent rounded">{task.type}</span>
                          {agent && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded">{agent.name}</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-1">
                          {task.status === 'ready' && (
                            <button
                              onClick={() => handleRunTask(task.id)}
                              className="px-2 py-1 text-[10px] bg-success/10 text-success rounded hover:bg-success/20"
                            >
                              ▶ Run
                            </button>
                          )}
                          {task.status === 'failed' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'ready')}
                              className="px-2 py-1 text-[10px] bg-warning/10 text-warning rounded hover:bg-warning/20"
                            >
                              ↻ Retry
                            </button>
                          )}
                          {task.status === 'review' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'done')}
                              className="px-2 py-1 text-[10px] bg-success/10 text-success rounded hover:bg-success/20"
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
