import { guard } from '$lib/auth.svelte.js';

export function load({ url }) {
  guard(url, 'admin'); // semua halaman /admin/* khusus admin
}
