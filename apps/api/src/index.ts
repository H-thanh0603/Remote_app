import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { initDb } from './db/index.js'
import { seedDatabase } from './db/seed.js'
import { toolRoutes } from './routes/tools.js'
import { taskRoutes } from './routes/tasks.js'
import { healthRoutes } from './routes/health.js'
import { wsManager } from './services/websocket.js'
import { getAllTools } from './db/repositories/tools.js'
import { getRecentTasks } from './db/repositories/tasks.js'
import { notificationRoutes } from './routes/notifications.js'
import './services/index.js'

const server = Fastify({
  logger: true,
})

// Register plugins
await server.register(cors, {
  origin: true,
})

await server.register(websocket)

// Register routes
await server.register(healthRoutes)
await server.register(toolRoutes)
await server.register(taskRoutes)
await server.register(notificationRoutes)

// WebSocket endpoint
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, _req) => {
    // Handle connection
    wsManager.handleConnection(socket)

    // Send initial state to new client
    const clientId = Math.random().toString(36).slice(2, 10)
    const tools = getAllTools()
    const activeTasks = getRecentTasks(10)

    wsManager.send(socket, 'system:connected', {
      clientId,
      connectedClients: wsManager.getClientCount(),
      initialState: { tools, activeTasks },
    })

    fastify.log.info(`[WS] Client connected: ${clientId}. Total: ${wsManager.getClientCount()}`)
  })
})

// Global error handler
server.setErrorHandler((error, _req, reply) => {
  server.log.error(error)
  const statusCode = error.statusCode ?? 500
  reply.code(statusCode).send({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : error.message,
  })
})

// 404 handler
server.setNotFoundHandler((_req, reply) => {
  reply.code(404).send({ success: false, error: 'Route not found' })
})

// Request logging
server.addHook('onRequest', async (req) => {
  server.log.info(`${req.method} ${req.url}`)
})

// Start server
const start = async (): Promise<void> => {
  try {
    initDb()
    seedDatabase()
    await server.listen({ port: 3001, host: '0.0.0.0' })
    console.log('🚀 API server running on http://localhost:3001')

    // Start heartbeat
    wsManager.startHeartbeat(() => getAllTools())
    console.log('💓 WebSocket heartbeat started (30s interval)')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

await start()
