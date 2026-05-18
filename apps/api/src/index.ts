import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'

const server = Fastify({
  logger: true,
})

// Register plugins
await server.register(cors, {
  origin: true,
})

await server.register(websocket)

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

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

// Start server
const start = async (): Promise<void> => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })
    console.log('🚀 API server running on http://localhost:3001')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

await start()
