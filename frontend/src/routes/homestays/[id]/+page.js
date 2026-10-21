import { api } from '$lib/api';

export async function load({ params }) {
  const [homestay, rooms, reviews] = await Promise.all([
    api.getHomestay(params.id),
    api.getRooms(params.id),
    api.getReviews(params.id)
  ]);
  return { homestay, rooms, reviews };
}
