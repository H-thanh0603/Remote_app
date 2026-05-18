import type { WebSocket } from '@fastify/websocket'
import type { WsEventType, WsMessage } from '@remote-app/shared'

class WebSocketManager {
  private clients: Set<WebSocket> = new Set()
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  handleConnection(socket: WebSocket): void {
    this.clients.add(socket)

    socket.on('close', () => {
      this.handleDisconnection(socket)
    })

    socket.on('error', (err: Error) => {
      console.error('[WS] Socket error:', err.message)
      this.handleDisconnection(socket)
    })

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString())
        console.log('[WS] Received:', msg)
      } catch {
        console.warn('[WS] Malformed message received')
      }
    })
  }

  handleDisconnection(socket: WebSocket): void {
    this.clients.delete(socket)
    console.log(`[WS] Client disconnected. Total: ${this.clients.size}`)
  }

  broadcast(event: WsEventType, data: unknown): void {
    const message: WsMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    }
    const payload = JSON.stringify(message)
    for (const client of this.clients) {
      try {
        if (client.readyState === 1) {
          client.send(payload)
        }
      } catch (err) {
        console.error('[WS] Broadcast error:', err)
        this.clients.delete(client)
      }
    }
  }

  send(client: WebSocket, event: WsEventType, data: unknown): void {
    const message: WsMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    }
    try {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message))
      }
    } catch (err) {
      console.error('[WS] Send error:', err)
      this.clients.delete(client)
    }
  }

  getClientCount(): number {
    return this.clients.size
  }

  startHeartbeat(getToolsFn: () => unknown[]): void {
    if (this.heartbeatInterval) return
    this.heartbeatInterval = setInterval(() => {
      if (this.clients.size === 0) return
      this.broadcast('system:heartbeat', {
        timestamp: new Date().toISOString(),
        tools: getToolsFn(),
      })
    }, 30000)
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

export const wsManager = new WebSocketManager()
