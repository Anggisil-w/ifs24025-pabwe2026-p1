import { api } from '$lib/api';

export async function load({ depends }) {
  depends('app:admin-homestays');
  return { homestays: await api.getHomestays() };
}
