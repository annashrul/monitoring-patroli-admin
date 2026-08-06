import { io } from 'socket.io-client';

let socket = null;

/**
 * Mengembalikan singleton socket.io-client yang terkoneksi dengan auth { token }.
 * Jika sudah ada koneksi, kembalikan yang lama (server & port sama dengan API).
 */
export function connectSocket(token) {
  if (socket) return socket;

  const url = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('disconnect', () => {
    // koneksi terputus; instance tetap dipakai ulang oleh socket.io (auto-reconnect)
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
