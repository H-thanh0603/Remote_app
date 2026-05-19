import { useEffect, useRef, useState } from 'react';
import { useRunStore } from '../stores';

export function Terminal() {
  const { sessions } = useRunStore();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const logRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeSession?.logs]);

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Terminal</h1>
        <p className="text-text-secondary text-sm mt-1">Execution logs for each task run</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {sessions.length === 0 ? (
          <span className="px-3 py-2 text-xs text-text-muted">No sessions yet</span>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                session.id === activeSessionId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              {session.agentId} • {session.taskId.slice(0, 8)}
              <span className={`ml-2 inline-block w-1.5 h-1.5 rounded-full ${
                session.status === 'running' ? 'bg-warning animate-pulse' :
                session.status === 'completed' ? 'bg-success' :
                session.status === 'failed' ? 'bg-error' : 'bg-text-muted'
              }`} />
            </button>
          ))
        )}
      </div>

      {/* Log Output */}
      <div
        ref={logRef}
        className="flex-1 bg-background border border-border rounded-lg p-4 overflow-y-auto font-mono text-xs leading-relaxed"
      >
        {!activeSession ? (
          <div className="text-text-muted text-center py-12">
            <p className="text-3xl mb-2">💻</p>
            <p>Run a task to see execution logs here</p>
          </div>
        ) : (
          <>
            <div className="text-text-muted mb-2">
              $ {activeSession.command}
            </div>
            {activeSession.logs.map((log, i) => (
              <div key={i} className="text-text whitespace-pre-wrap">{log}</div>
            ))}
            {activeSession.status === 'running' && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
            )}
            {activeSession.error && (
              <div className="text-error mt-2">Error: {activeSession.error}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
