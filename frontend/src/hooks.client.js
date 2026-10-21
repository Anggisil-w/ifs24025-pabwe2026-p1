// Tampilkan pesan error asli (bukan sekadar "Internal Error")
export function handleError({ error }) {
  console.error(error);
  return { message: error?.message ?? 'Terjadi kesalahan' };
}
