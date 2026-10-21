import { redirect } from '@sveltejs/kit';

// URL lama dialihkan ke /auth/register
export function load({ url }) {
  redirect(307, '/auth/register' + url.search);
}
