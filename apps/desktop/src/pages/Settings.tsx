import { useProjectStore } from '../stores';
import type { GovernanceRule } from '../types';

export function Settings() {
  const { getActiveProject, updateProject } = useProjectStore();
  const project = getActiveProject();

  const toggleRule = (ruleId: string) => {
    if (!project) return;
    const updated = project.governanceRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    updateProject(project.id, { governanceRules: updated });
  };

  const addRule = () => {
    if (!project) return;
    const text = prompt('Enter governance rule:');
    if (!text?.trim()) return;
    const rule: GovernanceRule = { id: `gov-${Date.now()}`, text: text.trim(), enabled: true };
    updateProject(project.id, { governanceRules: [...project.governanceRules, rule] });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Project configuration and governance rules</p>
      </div>

      {/* API Connection */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold">API Connection</h2>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-sm text-text-secondary">Connected to localhost:3001</span>
        </div>
      </div>

      {/* Governance Rules */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Governance Rules</h2>
          <button onClick={addRule} className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
            + Add Rule
          </button>
        </div>

        {!project ? (
          <p className="text-sm text-text-muted">No active project selected</p>
        ) : project.governanceRules.length === 0 ? (
          <p className="text-sm text-text-muted">No rules defined</p>
        ) : (
          <div className="space-y-2">
            {project.governanceRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                    rule.enabled ? 'bg-success/20 border-success text-success' : 'border-text-muted text-text-muted'
                  }`}
                >
                  {rule.enabled ? '✓' : ''}
                </button>
                <span className={`text-sm flex-1 ${rule.enabled ? 'text-text' : 'text-text-muted line-through'}`}>
                  {rule.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tech Stack */}
      {project && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span key={tech} className="px-3 py-1 text-sm bg-background border border-border rounded-lg">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
