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
const rawOrigins = process.env.FRONTEND_URL || '*';
const allowedOrigins = rawOrigins === '*'
  ? '*'
  : rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ---- Health check ----
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'codenames-server', timestamp: Date.now() });
});

// ---- Root (optional, for browser check) ----
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Codenames server is running' });
});

// ---- Static files (only useful if serving client from same container) ----
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA fallback — skip /socket.io and /health
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
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

try {
  registerSocketHandlers(io);
} catch (err) {
  console.error('🔴 registerSocketHandlers failed:', err);
  process.exit(1);
}

console.log('Railway injected PORT:', process.env.PORT);

// ---- Listen (Railway requires 0.0.0.0 and process.env.PORT) ----
const port = process.env.PORT || 3001;
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`✅ Codenames server listening on 0.0.0.0:${port}`);
  console.log(`   CORS origins: ${allowedOrigins === '*' ? '* (open)' : allowedOrigins.join(', ')}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown (Railway sends SIGTERM on redeploy)
process.on('SIGTERM', () => {
  console.log('SIGTERM received — closing server...');
  httpServer.close(() => process.exit(0));
});