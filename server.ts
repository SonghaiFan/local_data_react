import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import path from 'path'
import fs from 'fs'
import ip from 'ip'

// Prepare Next.js app
const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Create uploads directory if not exists
// This path is used for serving static files
const uploadDir = path.join(process.cwd(), 'public/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
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
})
