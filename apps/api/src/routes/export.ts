import { FastifyInstance } from 'fastify';
import { getDb } from '../db';

export async function exportRoutes(fastify: FastifyInstance) {
  // Export single task as JSON or Markdown
  fastify.get<{ Params: { id: string }; Querystring: { format?: string } }>(
    '/export/task/:id',
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params;
      const { format = 'json' } = request.query;

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
      if (!task) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(task.tool_id) as any;

      if (format === 'md' || format === 'markdown') {
        const duration = task.completed_at && task.created_at
          ? new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()
          : null;

        const md = `# Task Result

**Prompt:** ${task.prompt}
**Tool:** ${tool?.name || task.tool_id}
**Status:** ${task.status}
**Duration:** ${duration !== null ? `${duration}ms` : 'N/A'}
**Tokens:** ${task.tokens_used || 'N/A'}
**Date:** ${task.created_at}

## Result

${task.result || '_No result yet_'}
`;
        reply.header('Content-Type', 'text/markdown');
        reply.header('Content-Disposition', `attachment; filename="task-${id}.md"`);
        return reply.send(md);
      }

      // Default JSON
      return reply.send({
        id: task.id,
        prompt: task.prompt,
        tool: tool?.name || task.tool_id,
        status: task.status,
        result: task.result,
        tokens_used: task.tokens_used,
        created_at: task.created_at,
        completed_at: task.completed_at,
      });
    }
  );

  // Export filtered tasks as JSON, Markdown, or CSV
  fastify.get<{ Querystring: { format?: string; status?: string; tool_id?: string; limit?: string } }>(
    '/export/tasks',
    async (request, reply) => {
      const db = getDb();
      const { format = 'json', status, tool_id, limit = '100' } = request.query;

      let query = 'SELECT t.*, tl.name as tool_name FROM tasks t LEFT JOIN tools tl ON t.tool_id = tl.id WHERE 1=1';
      const params: any[] = [];

      if (status) { query += ' AND t.status = ?'; params.push(status); }
      if (tool_id) { query += ' AND t.tool_id = ?'; params.push(tool_id); }
      query += ' ORDER BY t.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const tasks = db.prepare(query).all(...params) as any[];

      if (format === 'csv') {
        const header = 'id,prompt,tool,status,duration_ms,tokens,created_at,completed_at\n';
        const rows = tasks.map(t => {
          const duration = t.completed_at && t.created_at
            ? new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()
            : '';
          const prompt = `"${(t.prompt || '').replace(/"/g, '""')}"`;
          return `${t.id},${prompt},${t.tool_name || ''},${t.status},${duration},${t.tokens_used || ''},${t.created_at},${t.completed_at || ''}`;
        }).join('\n');

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="tasks.csv"');
        return reply.send(header + rows);
      }

      if (format === 'md' || format === 'markdown') {
        const rows = tasks.map(t => `| ${t.id.slice(0, 8)} | ${t.prompt?.slice(0, 40) || ''} | ${t.tool_name || ''} | ${t.status} |`).join('\n');
        const md = `# Tasks Export\n\n| ID | Prompt | Tool | Status |\n|---|---|---|---|\n${rows}\n`;
        reply.header('Content-Type', 'text/markdown');
        return reply.send(md);
      }

      return reply.send({ tasks, total: tasks.length });
    }
  );

  // Generate usage report
  fastify.get<{ Querystring: { from?: string; to?: string } }>(
    '/export/report',
    async (request, reply) => {
      const db = getDb();
      const { from, to } = request.query;

      let dateFilter = '';
      const params: any[] = [];
      if (from) { dateFilter += ' AND t.created_at >= ?'; params.push(from); }
      if (to) { dateFilter += ' AND t.created_at <= ?'; params.push(to); }

      const total = (db.prepare(`SELECT COUNT(*) as count FROM tasks t WHERE 1=1${dateFilter}`).get(...params) as any).count;
      const completed = (db.prepare(`SELECT COUNT(*) as count FROM tasks t WHERE t.status = 'completed'${dateFilter}`).get(...params) as any).count;
      const failed = (db.prepare(`SELECT COUNT(*) as count FROM tasks t WHERE t.status = 'failed'${dateFilter}`).get(...params) as any).count;
      const totalTokens = (db.prepare(`SELECT SUM(tokens_used) as sum FROM tasks t WHERE 1=1${dateFilter}`).get(...params) as any).sum || 0;

      const avgDuration = db.prepare(`
        SELECT AVG(
          (julianday(completed_at) - julianday(created_at)) * 86400000
        ) as avg
        FROM tasks t
        WHERE completed_at IS NOT NULL${dateFilter}
      `).get(...params) as any;

      const byTool = db.prepare(`
        SELECT tl.name, COUNT(*) as tasks,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as success,
          AVG((julianday(t.completed_at) - julianday(t.created_at)) * 86400000) as avg_duration
        FROM tasks t
        LEFT JOIN tools tl ON t.tool_id = tl.id
        WHERE 1=1${dateFilter}
        GROUP BY t.tool_id
      `).all(...params) as any[];

      const recentTasks = db.prepare(`
        SELECT t.id, t.prompt, tl.name as tool, t.status, t.created_at
        FROM tasks t LEFT JOIN tools tl ON t.tool_id = tl.id
        WHERE 1=1${dateFilter}
        ORDER BY t.created_at DESC LIMIT 10
      `).all(...params) as any[];

      const period = `${from || 'All time'} — ${to || 'Now'}`;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const avgMs = Math.round(avgDuration?.avg || 0);

      const toolTable = byTool.map(t =>
        `| ${t.name || 'Unknown'} | ${t.tasks} | ${t.tasks > 0 ? Math.round((t.success / t.tasks) * 100) : 0}% | ${Math.round(t.avg_duration || 0)}ms |`
      ).join('\n');

      const recentList = recentTasks.map(t =>
        `- [${t.status}] ${t.prompt?.slice(0, 60) || ''} (${t.tool || 'unknown'})`
      ).join('\n');

      const report = `# AI Command Center — Usage Report
**Period:** ${period}

## Summary
- Total tasks: ${total}
- Completed: ${completed} (${successRate}%)
- Failed: ${failed}
- Total tokens: ${totalTokens}
- Avg duration: ${avgMs}ms

## By Tool
| Tool | Tasks | Success Rate | Avg Duration |
|------|-------|-------------|--------------|
${toolTable}

## Recent Tasks
${recentList}
`;

      return reply.send({ report, stats: { total, completed, failed, totalTokens, avgMs, successRate } });
    }
  );
}
