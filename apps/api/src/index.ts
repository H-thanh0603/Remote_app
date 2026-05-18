import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { initDb } from './db/index.js'
import { seedDatabase } from './db/seed.js'
import { toolRoutes } from './routes/tools.js'
import { taskRoutes } from './routes/tasks.js'
import { healthRoutes } from './routes/health.js'

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

// WebSocket endpoint
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, _req) => {
    socket.on('message', (message: Buffer) => {
      const data = message.toString()
      fastify.log.info(`WebSocket message: ${data}`)
      socket.send(JSON.stringify({ type: 'ack', data }))
    })

    socket.on('close', () => {
      fastify.log.info('WebSocket client disconnected')
    })
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
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

await start()
