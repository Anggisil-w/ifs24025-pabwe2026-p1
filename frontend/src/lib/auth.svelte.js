import { redirect } from '@sveltejs/kit';

const KEY = 'homestay_auth';

function baca() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

const tersimpan = typeof localStorage !== 'undefined' ? baca() : {};

/** State login global: { token, user } */
export const auth = $state({ token: tersimpan.token ?? null, user: tersimpan.user ?? null });

export function setAuth(token, user) {
  auth.token = token;
  auth.user = user;
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, user }));
  } catch {
    /* abaikan jika storage tidak tersedia */
  }
}

export function clearAuth() {
  auth.token = null;
  auth.user = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}

/** Dipanggil di +page.js: arahkan ke /login bila belum login / bukan role yang dibutuhkan. */
export function guard(url, role) {
  if (!auth.user) {
    const tujuan = url.pathname + url.search;
    redirect(307, tujuan === '/' ? '/auth/login' : `/auth/login?next=${encodeURIComponent(tujuan)}`);
  }
  if (role && auth.user.role !== role) redirect(307, '/');
}

/** Hanya terima path internal untuk parameter ?next= (cegah open redirect). */
export function amanNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}
