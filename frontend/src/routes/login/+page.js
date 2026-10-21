import { redirect } from '@sveltejs/kit';

// URL lama dialihkan ke /auth/login
export function load({ url }) {
  redirect(307, '/auth/login' + url.search);
}
