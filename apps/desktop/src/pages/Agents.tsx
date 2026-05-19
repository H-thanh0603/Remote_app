import { useAgentStore } from '../stores';

export function Agents() {
  const { agents, updateAgent } = useAgentStore();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-text-secondary text-sm mt-1">Manage AI coding agents</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'online' ? 'bg-success' :
                  agent.status === 'error' ? 'bg-error' : 'bg-text-muted'
                }`} />
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-xs text-text-muted">{agent.type} • {agent.command || 'manual'}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                agent.status === 'online' ? 'bg-success/10 text-success' :
                agent.status === 'error' ? 'bg-error/10 text-error' : 'bg-text-muted/10 text-text-muted'
              }`}>
                {agent.status}
              </span>
            </div>

            <p className="text-sm text-text-secondary mb-3">{agent.description}</p>

            {/* Strengths */}
            <div className="mb-3">
              <p className="text-xs text-text-muted mb-1.5">Strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.strengths.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Task Types */}
            <div className="mb-3">
              <p className="text-xs text-text-muted mb-1.5">Supported Tasks</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.supportedTaskTypes.map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border">
              <span>Reliability: {agent.reliabilityScore}/10</span>
              <span>Max concurrent: {agent.maxConcurrentTasks}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
