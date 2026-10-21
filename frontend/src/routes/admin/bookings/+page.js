import { api } from '$lib/api';
import { guard } from '$lib/auth.svelte.js';

export async function load({ url, depends }) {
  guard(url, 'admin');
  depends('app:bookings');
  return { bookings: await api.getBookings() };
}
