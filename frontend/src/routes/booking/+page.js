import { api } from '$lib/api';
import { guard } from '$lib/auth.svelte.js';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
  guard(url); // wajib login
  const roomId = url.searchParams.get('room');
  if (!roomId) error(400, 'Pilih kamar terlebih dahulu');
  return {
    room: await api.getRoom(roomId),
    check_in: url.searchParams.get('check_in') ?? '',
    check_out: url.searchParams.get('check_out') ?? '',
    tamu: Number(url.searchParams.get('tamu')) || 1
  };
}
