import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerSocketHandlers } from './transport/socketHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ---- CORS ----
// Railway: FRONTEND_URL = public URL of the client service.
// Supports comma-separated list (e.g. "https://a.com,https://b.com").
const rawOrigins = process.env.FRONTEND_URL || '*';
const allowedOrigins = rawOrigins === '*'
  ? '*'
  : rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ---- Health check (Railway uses this to verify the service is up) ----
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'codenames-server', timestamp: Date.now() });
});

// ---- Static files (only useful when serving the client build from same container) ----
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA fallback for client routes — skip /socket.io and /health
app.get(/^\/(?!socket\.io|health).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// ---- HTTP + Socket.IO ----
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],  // WebSocket first for lower latency
  pingTimeout: 60000,
  pingInterval: 25000,
});

registerSocketHandlers(io);

// ---- Listen ----
// Railway injects PORT and requires binding on 0.0.0.0.
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`✅ Codenames server listening on ${HOST}:${PORT}`);
  console.log(`   CORS origins: ${allowedOrigins === '*' ? '* (open)' : allowedOrigins.join(', ')}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown (Railway sends SIGTERM on redeploy)
process.on('SIGTERM', () => {
  console.log('SIGTERM received — closing server...');
  httpServer.close(() => process.exit(0));
});