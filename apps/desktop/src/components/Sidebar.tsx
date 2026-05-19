import { NavLink } from 'react-router-dom';
import { useUIStore, useTaskStore, useGoalStore } from '../stores';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/projects', label: 'Projects', icon: '📁' },
  { path: '/agents', label: 'Agents', icon: '🤖' },
  { path: '/orchestrator', label: 'Orchestrator', icon: '🧠' },
  { path: '/tasks', label: 'Tasks', icon: '📋' },
  { path: '/terminal', label: 'Terminal', icon: '💻' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const runningTasks = useTaskStore((s) => s.tasks.filter((t) => t.status === 'running').length);
  const activeGoals = useGoalStore((s) => s.goals.filter((g) => g.status === 'running').length);

  return (
    <aside
      className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-text truncate">AI Orchestrator</h1>
            <p className="text-xs text-text-muted">v0.2.0</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-surface-hover text-text-secondary"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {!sidebarCollapsed && (
              <span className="flex-1">{item.label}</span>
            )}
            {!sidebarCollapsed && item.path === '/tasks' && runningTasks > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                {runningTasks}
              </span>
            )}
            {!sidebarCollapsed && item.path === '/orchestrator' && activeGoals > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-accent/20 text-accent rounded-full">
                {activeGoals}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-muted">API Connected</span>
          </div>
        </div>
      )}
    </aside>
  );
}
