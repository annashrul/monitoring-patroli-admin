import { io } from 'socket.io-client';
import { getApiBaseUrl } from './config';

let socket = null;

/**
 * Mengembalikan singleton socket.io-client yang terkoneksi dengan auth { token }.
 */
export async function connectSocket(token) {
  if (socket) return socket;

  const url = await getApiBaseUrl();
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
