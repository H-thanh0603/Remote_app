const API_BASE = 'http://localhost:3001/api';

export const api = {
  getTools: () => fetch(`${API_BASE}/tools`).then(r => r.json()),
  getTool: (id: string) => fetch(`${API_BASE}/tools/${id}`).then(r => r.json()),
  updateToolStatus: (id: string, status: string) =>
    fetch(`${API_BASE}/tools/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.json()),
  createTask: (prompt: string) =>
    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(r => r.json()),
  confirmTask: (taskId: string, toolId: string) =>
    fetch(`${API_BASE}/tasks/${taskId}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId }),
    }).then(r => r.json()),
  cancelTask: (taskId: string) =>
    fetch(`${API_BASE}/tasks/${taskId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.json()),
  getTasks: () => fetch(`${API_BASE}/tasks`).then(r => r.json()),
  getHealth: () => fetch(`${API_BASE}/health`).then(r => r.json()),
};
