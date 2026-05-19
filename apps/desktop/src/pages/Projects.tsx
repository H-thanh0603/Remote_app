import { useState } from 'react';
import { useProjectStore } from '../stores';
import type { Project } from '../types';

export function Projects() {
  const { projects, addProject, deleteProject, setActiveProject, activeProjectId } = useProjectStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [path, setPath] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      path: path.trim(),
      techStack: [],
      governanceRules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(project);
    setName(''); setDescription(''); setPath('');
    setShowCreate(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your coding projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Project List */}
      <div className="grid grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`bg-surface border rounded-xl p-5 cursor-pointer transition-colors ${
              project.id === activeProjectId ? 'border-primary' : 'border-border hover:border-text-muted'
            }`}
            onClick={() => setActiveProject(project.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{project.name}</h3>
              {project.id === activeProjectId && (
                <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">Active</span>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-3">{project.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.techStack.map((tech) => (
                <span key={tech} className="px-2 py-0.5 text-xs bg-background border border-border rounded">
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>📂 {project.path}</span>
              <span>{project.governanceRules.length} rules</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">New Project</h2>
            <input
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none h-20"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="Project path (e.g. D:\my-project)"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text">
                Cancel
              </button>
              <button onClick={handleCreate} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm rounded-lg">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
