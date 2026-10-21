import { api } from '$lib/api';
import { guard } from '$lib/auth.svelte.js';

export async function load({ url, depends }) {
  guard(url);
  depends('app:pesanan');
  return { bookings: await api.getMyBookings() };
}
