import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// مسار بسيط للتأكد من أن السيرفر يعمل
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Codenames server is running!' });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || '*' },
  // مهم جداً على Vercel: إجبار استخدام WebSocket فقط
  transports: ['websocket'], 
});

// ... (كود Socket.IO handlers الخاص بك) ...

// لا تستخدم httpServer.listen() أبداً على Vercel
// صدّر السيرفر كـ default export
export default httpServer;