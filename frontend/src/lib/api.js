import { auth, clearAuth } from './auth.svelte.js';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error(`Tidak dapat terhubung ke API di ${BASE}. Pastikan back-end sudah berjalan.`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 && auth.token && !path.startsWith('/auth/')) {
      clearAuth(); // token kedaluwarsa / tidak valid
      throw new Error('Sesi berakhir, silakan login ulang.');
    }
    throw new Error(err.message ?? `Request gagal (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });

export const api = {
  // auth
  login: (email, password) => post('/auth/login', { email, password }),
  register: (nama, email, password) => post('/auth/register', { nama, email, password }),
  // data publik
  getHomestays: (q = '') => request(`/homestays${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getHomestay: (id) => request(`/homestays/${id}`),
  getRooms: (id) => request(`/homestays/${id}/rooms`),
  getRoom: (id) => request(`/rooms/${id}`),
  getReviews: (id) => request(`/homestays/${id}/reviews`),
  getAvailable: (params) => request(`/rooms/available?${new URLSearchParams(params)}`),
  // butuh login
  createBooking: (body) => post('/bookings', body),
  getMyBookings: () => request('/bookings/mine'),
  createReview: (body) => post('/reviews', body),
  cancelBooking: (id) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }),
  getFacilities: () => request('/facilities'),
  // admin: homestay & kamar
  createHomestay: (body) => post('/homestays', body),
  updateHomestay: (id, body) => put(`/homestays/${id}`, body),
  deleteHomestay: (id) => request(`/homestays/${id}`, { method: 'DELETE' }),
  createRoom: (homestayId, body) => post(`/homestays/${homestayId}/rooms`, body),
  updateRoom: (id, body) => put(`/rooms/${id}`, body),
  deleteRoom: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
  // admin: pemesanan
  getBookings: () => request('/bookings'),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};
