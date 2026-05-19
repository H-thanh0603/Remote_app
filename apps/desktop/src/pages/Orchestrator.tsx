import { useState } from 'react';
import { useGoalStore, useProjectStore, useTaskStore, useUIStore } from '../stores';
import { planGoal } from '../services/planner';
import type { Goal, Plan, CodingTask } from '../types';

export function Orchestrator() {
  const { goals, addGoal, updateGoal, addPlan, plans } = useGoalStore();
  const { getActiveProject } = useProjectStore();
  const { addTasks } = useTaskStore();
  const { addActivity, addToast } = useUIStore();

  const [goalInput, setGoalInput] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);

  const activeProject = getActiveProject();
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const selectedPlan = selectedGoal?.planId ? plans.find((p) => p.id === selectedGoal.planId) : undefined;

  const handleCreateGoal = () => {
    if (!goalInput.trim() || !activeProject) return;
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      projectId: activeProject.id,
      title: goalInput.trim(),
      description: goalInput.trim(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGoal(goal);
    setGoalInput('');
    setSelectedGoalId(goal.id);
    addActivity({ type: 'goal_created', title: 'Goal created', description: goal.title });
    addToast({ type: 'success', title: 'Goal created', description: goal.title });
  };

  const handleGeneratePlan = async () => {
    if (!selectedGoal || !activeProject) return;
    setPlanning(true);

    try {
      const { plan, tasks } = planGoal(selectedGoal, activeProject);
      addPlan(plan);
      addTasks(tasks);
      updateGoal(selectedGoal.id, { status: 'planned', planId: plan.id });
      addActivity({ type: 'plan_generated', title: 'Plan generated', description: `${tasks.length} tasks created for "${selectedGoal.title}"` });
      addToast({ type: 'success', title: 'Plan generated', description: `${tasks.length} tasks created` });
    } catch (err) {
      addToast({ type: 'error', title: 'Planning failed', description: (err as Error).message });
    } finally {
      setPlanning(false);
    }
  };

  const handleApprovePlan = () => {
    if (!selectedGoal || !selectedPlan) return;
    useGoalStore.getState().updatePlan(selectedPlan.id, { status: 'approved', approvedAt: new Date().toISOString() });
    updateGoal(selectedGoal.id, { status: 'approved' });
    addActivity({ type: 'plan_generated', title: 'Plan approved', description: `Plan for "${selectedGoal.title}" approved` });
    addToast({ type: 'success', title: 'Plan approved' });
  };

  const handleStartOrchestration = () => {
    if (!selectedGoal || !selectedPlan) return;
    useGoalStore.getState().updatePlan(selectedPlan.id, { status: 'running' });
    updateGoal(selectedGoal.id, { status: 'running' });

    // Move all tasks to ready
    const tasks = useTaskStore.getState().tasks.filter((t) => selectedPlan.epics.some((e) => e.id === t.epicId));
    tasks.forEach((t) => {
      if (t.status === 'backlog' && (!t.dependencies.length)) {
        useTaskStore.getState().updateTask(t.id, { status: 'ready' });
      }
    });

    addActivity({ type: 'task_assigned', title: 'Orchestration started', description: `Running "${selectedGoal.title}"` });
    addToast({ type: 'info', title: 'Orchestration started' });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧠 Master Orchestrator</h1>
        <p className="text-text-secondary text-sm mt-1">Define goals, generate plans, orchestrate agents</p>
      </div>

      {/* Goal Input */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">New Goal</h2>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            placeholder="Describe your goal... (e.g. Build a REST API with authentication)"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateGoal()}
          />
          <button
            onClick={handleCreateGoal}
            disabled={!goalInput.trim() || !activeProject}
            className="px-5 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Goal
          </button>
        </div>
        {!activeProject && <p className="text-xs text-warning mt-2">⚠️ Select a project first</p>}
      </div>

      {/* Goals List */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Goals</h2>
        {goals.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No goals yet</p>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  goal.id === selectedGoalId ? 'bg-primary/10 border border-primary/30' : 'bg-background border border-border hover:border-text-muted'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{goal.title}</p>
                  <p className="text-xs text-text-muted">{goal.projectId}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  goal.status === 'draft' ? 'bg-text-muted/10 text-text-muted' :
                  goal.status === 'planned' ? 'bg-primary/10 text-primary' :
                  goal.status === 'approved' ? 'bg-accent/10 text-accent' :
                  goal.status === 'running' ? 'bg-warning/10 text-warning' :
                  goal.status === 'completed' ? 'bg-success/10 text-success' :
                  'bg-error/10 text-error'
                }`}>
                  {goal.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Goal Actions */}
      {selectedGoal && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Plan for: {selectedGoal.title}</h2>
            <div className="flex gap-2">
              {selectedGoal.status === 'draft' && (
                <button
                  onClick={handleGeneratePlan}
                  disabled={planning}
                  className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {planning ? '⏳ Generating...' : '🧠 Generate Plan'}
                </button>
              )}
              {selectedGoal.status === 'planned' && (
                <button
                  onClick={handleApprovePlan}
                  className="px-4 py-2 bg-success hover:bg-success/80 text-white text-sm rounded-lg"
                >
                  ✅ Approve Plan
                </button>
              )}
              {selectedGoal.status === 'approved' && (
                <button
                  onClick={handleStartOrchestration}
                  className="px-4 py-2 bg-warning hover:bg-warning/80 text-white text-sm rounded-lg"
                >
                  🚀 Start Orchestration
                </button>
              )}
            </div>
          </div>

          {/* Plan Details */}
          {selectedPlan && (
            <div className="space-y-3">
              {selectedPlan.epics.map((epic) => (
                <div key={epic.id} className="bg-background border border-border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">{epic.title}</h3>
                  <div className="space-y-1.5">
                    {epic.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 text-xs p-2 rounded bg-surface">
                        <span className={`px-1.5 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-error/10 text-error' :
                          task.priority === 'high' ? 'bg-warning/10 text-warning' :
                          task.priority === 'medium' ? 'bg-primary/10 text-primary' :
                          'bg-text-muted/10 text-text-muted'
                        }`}>{task.priority}</span>
                        <span className="flex-1">{task.title}</span>
                        <span className="text-text-muted">{task.type}</span>
                        <span className="text-accent">{task.assignedAgentId || 'unassigned'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {selectedGoal.status !== 'draft' && (
            <div className="border-t border-border pt-4">
              <h3 className="text-xs text-text-muted uppercase tracking-wide mb-3">Timeline</h3>
              <div className="space-y-2">
                <TimelineItem done label="Goal received" time={selectedGoal.createdAt} />
                <TimelineItem done={selectedGoal.status !== 'draft'} label="Plan generated" />
                <TimelineItem done={['approved', 'running', 'completed'].includes(selectedGoal.status)} label="Plan approved" />
                <TimelineItem done={['running', 'completed'].includes(selectedGoal.status)} label="Execution started" />
                <TimelineItem done={selectedGoal.status === 'completed'} label="Review completed" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineItem({ done, label, time }: { done: boolean; label: string; time?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full border-2 ${done ? 'bg-success border-success' : 'border-text-muted'}`} />
      <span className={`text-sm ${done ? 'text-text' : 'text-text-muted'}`}>{label}</span>
      {time && <span className="text-xs text-text-muted ml-auto">{new Date(time).toLocaleString()}</span>}
    </div>
  );
}
