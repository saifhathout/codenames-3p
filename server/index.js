import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './transport/socketHandlers.js';

const app = express();
app.use(cors()); // مهم عشان Vercel

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*', // رابط الفرونت على Vercel
    methods: ['GET', 'POST'],
  },
  // Vercel محتاجة WebSocket صريح عشان تتخطى مشكلة الـ Sticky Sessions
  transports: ['websocket'], 
});

// صحّح المسار لو ملفاتك في مجلد تاني
registerSocketHandlers(io);

// بدل httpServer.listen(PORT, ...)
export default httpServer;