import { createServer } from 'http'
import { createServer as createNetServer } from 'net'
import next from 'next'
import { Server } from 'socket.io'
import path from 'path'
import fs from 'fs'
import ip from 'ip'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const requestedPort = Number(process.env.PORT ?? 3000)

function isValidPort(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 65535
}

function canBindPort(port: number, host: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tester = createNetServer()
      .once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          resolve(false)
          return
        }
        reject(err)
      })
      .once('listening', () => {
        tester.close(() => resolve(true))
      })

    tester.listen(port, host)
  })
}

async function findAvailablePort(startPort: number, host: string): Promise<number> {
  const maxAttempts = 100

  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidate = startPort + offset
    if (candidate > 65535) break
    if (await canBindPort(candidate, host)) return candidate
  }

  throw new Error(`No available port found starting at ${startPort}`)
}

// Create uploads directory if not exists
// This path is used for serving static files
const uploadDir = path.join(process.cwd(), 'public/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

if (!isValidPort(requestedPort)) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`)
}

async function start() {
  const port = await findAvailablePort(requestedPort, hostname)
  if (port !== requestedPort) {
    console.warn(`Port ${requestedPort} is busy, using ${port} instead.`)
  }

  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()

  await app.prepare()

  const server = createServer(async (req, res) => {
    try {
      await handle(req, res)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Attach Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "*", // allow all mostly for local dev
      methods: ["GET", "POST"]
    }
  })

  // Make IO instance available globally or pass via middleware?
  // Since we are in a custom server, we can't easily inject into Next.js App Router context
  // But we can listen to events from clients here.
  // Or simpler: clients upload via HTTP POST api route,
  // and that API route (or server check) triggers the broadcast.
  // Wait, Next.js API Route runs in separate context if deployed to Vercel,
  // but here in custom server, `global` is shared?
  // Let's attach `io` to the `global` object so API routes can access it.
  
  // @ts-ignore
  global.io = io

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
  })

  server.listen(port, hostname, (err?: any) => {
    if (err) throw err
    const localIp = ip.address()
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Network access: http://${localIp}:${port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
