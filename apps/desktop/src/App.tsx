import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Agents } from './pages/Agents';
import { Orchestrator } from './pages/Orchestrator';
import { TaskBoard } from './pages/TaskBoard';
import { Terminal } from './pages/Terminal';
import { Settings } from './pages/Settings';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/orchestrator" element={<Orchestrator />} />
          <Route path="/tasks" element={<TaskBoard />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
}
