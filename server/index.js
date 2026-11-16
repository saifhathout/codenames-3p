import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './transport/socketHandlers.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// مسار بسيط عشان تتأكد إن السيرفر شغال
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Codenames server running' });
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  transports: ['websocket'],   // ← مهم جداً على Vercel
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

registerSocketHandlers(io);

// ⚠️ لا تكتب httpServer.listen(...) خالص
export default httpServer;