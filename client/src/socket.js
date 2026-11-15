import { io } from 'socket.io-client';

// في Vercel: الكلاينت والسيرفر على نفس الدومين (أو دومين مختلف حسب النشر).
// في التطوير المحلي: نستخدم localhost:3001.
const isDev = import.meta.env.DEV;

const SERVER_URL = isDev
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_SERVER_URL || undefined);
// undefined = يتصل بنفس origin الصفحة (مهم لو السيرفر على نفس دومين Vercel)

export const socket = io(SERVER_URL, {
  // Vercel لا تدعم Sticky Sessions، لذا يجب استخدام WebSocket فقط
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 15,
  timeout: 20000,
});

if (isDev) {
  socket.on('connect', () => console.log('✅ socket connected:', socket.id));
  socket.on('disconnect', (r) => console.log('❌ socket disconnected:', r));
  socket.on('connect_error', (e) => console.error('⚠️ connect_error:', e.message));
}