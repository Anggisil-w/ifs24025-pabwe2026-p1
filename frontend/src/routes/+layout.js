import { redirect } from '@sveltejs/kit';
import { auth, guard } from '$lib/auth.svelte.js';

export const ssr = false;
export const prerender = false;

// Halaman yang boleh dibuka tanpa login
const halamanPublik = (p) => p === '/login' || p === '/register' || p.startsWith('/auth/');

export function load({ url }) {
  if (halamanPublik(url.pathname)) {
    // Sudah login tapi membuka halaman login/daftar -> kembali ke beranda
    if (auth.user && url.pathname.startsWith('/auth/')) redirect(307, '/');
  } else {
    guard(url); // belum login -> /auth/login (lalu kembali ke halaman tujuan)
  }
}
