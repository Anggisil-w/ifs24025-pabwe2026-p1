import { api } from '$lib/api';

export async function load() {
  return { homestays: await api.getHomestays() };
}
