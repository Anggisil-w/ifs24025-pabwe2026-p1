import { api } from '$lib/api';

export async function load({ params, depends }) {
  depends('app:admin-homestay');
  const [homestay, rooms, facilities] = await Promise.all([
    api.getHomestay(params.id),
    api.getRooms(params.id),
    api.getFacilities()
  ]);
  return { homestay, rooms, facilities };
}
