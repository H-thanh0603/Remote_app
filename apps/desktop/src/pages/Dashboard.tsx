import { useProjectStore, useAgentStore, useGoalStore, useTaskStore, useUIStore } from '../stores';

export function Dashboard() {
  const projects = useProjectStore((s) => s.projects);
  const agents = useAgentStore((s) => s.agents);
  const goals = useGoalStore((s) => s.goals);
  const tasks = useTaskStore((s) => s.tasks);
  const activities = useUIStore((s) => s.activities);

  const runningTasks = tasks.filter((t) => t.status === 'running').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const onlineAgents = agents.filter((a) => a.status === 'online').length;

  const stats = [
    { label: 'Projects', value: projects.length, icon: '📁', color: 'text-primary' },
    { label: 'Agents', value: `${onlineAgents}/${agents.length}`, icon: '🤖', color: 'text-success' },
    { label: 'Goals', value: goals.length, icon: '🎯', color: 'text-accent' },
    { label: 'Running', value: runningTasks, icon: '⚡', color: 'text-warning' },
    { label: 'Completed', value: completedTasks, icon: '✅', color: 'text-success' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Overview of your AI orchestration workspace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-text-muted uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Recent Activity</h2>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-3xl mb-2">🕐</p>
            <p className="text-sm">No activity yet. Create a goal to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <span className="text-text-muted text-xs whitespace-nowrap">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
                <div>
                  <p className="text-text">{a.title}</p>
                  <p className="text-text-muted text-xs">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Status */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Agent Status</h2>
        <div className="grid grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <div className={`w-2.5 h-2.5 rounded-full ${
                agent.status === 'online' ? 'bg-success' :
                agent.status === 'error' ? 'bg-error' : 'bg-text-muted'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <p className="text-xs text-text-muted">{agent.type}</p>
              </div>
              <span className="text-xs text-text-muted">{agent.reliabilityScore}/10</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
