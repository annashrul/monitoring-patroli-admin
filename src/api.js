import axios from 'axios';
import { getApiBaseUrl } from './config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

// Set base URL dinamis dari database di setiap request
api.interceptors.request.use(async (config) => {
  const base = await getApiBaseUrl();
  config.baseURL = base;
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Jika 401: hapus sesi & paksa kembali ke halaman login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper ambil pesan error dari server sesuai kontrak: { message: "..." }
export function getErrorMessage(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
  return (err && err.response && err.response.data && err.response.data.message) || fallback;
}

export default api;
