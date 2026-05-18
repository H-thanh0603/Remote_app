import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3001';
let taskId: string;

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  return { status: res.status, data };
}

describe('AI Command Center - Integration', () => {
  before(async () => {
    // Wait for server to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.ok) break;
      } catch {
        await new Promise(r => setTimeout(r, 500));
        retries--;
      }
    }
    if (retries === 0) throw new Error('Server not ready');
  });

  test('GET /api/health returns ok', async () => {
    const { status, data } = await fetchApi('/api/health');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, 'ok');
  });

  test('GET /api/tools returns 6 tools', async () => {
    const { status, data } = await fetchApi('/api/tools');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.length, 6);
    const toolIds = data.data.map((t: { id: string }) => t.id);
    assert.ok(toolIds.includes('openclaw'));
    assert.ok(toolIds.includes('antigravity'));
  });

  test('POST /api/tasks creates task with routing suggestion', async () => {
    const { status, data } = await fetchApi('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'write a Python script to parse JSON files' }),
    });
    assert.strictEqual(status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.id);
    assert.ok(data.data.suggestion);
    assert.ok(data.data.suggestion.toolId);
    assert.ok(data.data.suggestion.confidence > 0);
    taskId = data.data.id;
  });

  test('PUT /api/tasks/:id/confirm starts execution', async () => {
    assert.ok(taskId, 'taskId must be set from previous test');
    const { status, data } = await fetchApi(`/api/tasks/${taskId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ toolId: 'openclaw' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, 'confirmed');
  });

  test('GET /api/tasks/:id returns task', async () => {
    assert.ok(taskId, 'taskId must be set');
    const { status, data } = await fetchApi(`/api/tasks/${taskId}`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.id, taskId);
  });

  test('PUT /api/tools/:id/status updates and broadcasts', async () => {
    const { status, data } = await fetchApi('/api/tools/openclaw/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'idle' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.status, 'idle');
  });

  test('GET /api/settings returns settings', async () => {
    const { status, data } = await fetchApi('/api/settings');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data);
  });

  test('PUT /api/settings updates setting', async () => {
    const { status, data } = await fetchApi('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'notifications_enabled', value: 'true' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
  });

  test('WebSocket connects and receives initial state', async () => {
    const ws = new WebSocket(`ws://localhost:3001`);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WS timeout')), 5000);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'initial_state') {
          clearTimeout(timeout);
          assert.ok(msg.data.tools);
          assert.ok(msg.data.recentTasks !== undefined);
          ws.close();
          resolve();
        }
      };
      ws.onerror = (err) => { clearTimeout(timeout); reject(err); };
    });
  });

  test('Error: invalid task (empty prompt)', async () => {
    const { status, data } = await fetchApi('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ prompt: '' }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'VALIDATION_ERROR');
  });

  test('Error: confirm non-existent task', async () => {
    const { status, data } = await fetchApi('/api/tasks/non-existent-id/confirm', {
      method: 'PUT',
      body: JSON.stringify({ toolId: 'openclaw' }),
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'NOT_FOUND');
  });

  test('Error: tool not found', async () => {
    const { status, data } = await fetchApi('/api/tools/non-existent-tool');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.code, 'NOT_FOUND');
  });

  test('Full flow: create → route → confirm → execute → complete', async () => {
    // Create task
    const { data: createData } = await fetchApi('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'explain how React hooks work' }),
    });
    assert.strictEqual(createData.success, true);
    const id = createData.data.id;

    // Confirm
    const { data: confirmData } = await fetchApi(`/api/tasks/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ toolId: createData.data.suggestion.toolId }),
    });
    assert.strictEqual(confirmData.success, true);
    assert.strictEqual(confirmData.data.status, 'confirmed');

    // Wait for execution (max 15s)
    let completed = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      const { data: taskData } = await fetchApi(`/api/tasks/${id}`);
      if (['completed', 'failed'].includes(taskData.data?.status)) {
        completed = true;
        break;
      }
    }
    assert.ok(completed, 'Task should complete within 15s');
  });
});
