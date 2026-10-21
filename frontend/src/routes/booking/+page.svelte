<script>
  import { api, rupiah } from '$lib/api';
  import { auth } from '$lib/auth.svelte.js';
  let { data } = $props();

  let check_in = $state(data.check_in);
  let check_out = $state(data.check_out);
  let jumlah_tamu = $state(data.tamu);
  let telepon = $state('');
  let error = $state('');
  let hasil = $state(null);
  let loading = $state(false);

  let malam = $derived(
    check_in && check_out ? Math.round((new Date(check_out) - new Date(check_in)) / 86400000) : 0
  );
  let total = $derived(malam > 0 ? malam * data.room.harga_per_malam : 0);

  async function kirim(e) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      hasil = await api.createBooking({
        room_id: data.room.id,
        check_in,
        check_out,
        jumlah_tamu: Number(jumlah_tamu),
        telepon
      });
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<h1>Pesan Kamar</h1>
<p>
  <strong>{data.room.nama_kamar}</strong> — {data.room.nama_homestay} ({data.room.kota})<br />
  <span class="muted">{rupiah(data.room.harga_per_malam)} / malam · maks. {data.room.kapasitas} tamu</span>
</p>

{#if hasil}
  <div class="alert ok">
    Pemesanan #{hasil.id} berhasil dibuat dengan status <strong>{hasil.status}</strong>.
    Total: <strong>{rupiah(hasil.total_harga)}</strong>.
  </div>
  <a href="/pesanan">Lihat Pesanan Saya →</a>
{:else}
  {#if error}<div class="alert error">{error}</div>{/if}
  <form onsubmit={kirim}>
    <label>Check-in <input type="date" bind:value={check_in} required /></label>
    <label>Check-out <input type="date" bind:value={check_out} required /></label>
    <label>
      Jumlah tamu
      <input type="number" min="1" max={data.room.kapasitas} bind:value={jumlah_tamu} required />
    </label>
    <p class="muted">Memesan sebagai <strong>{auth.user?.nama}</strong> ({auth.user?.email})</p>
    <label>Telepon <input bind:value={telepon} /></label>
    <p>
      {#if total > 0}
        {malam} malam × {rupiah(data.room.harga_per_malam)} = <strong>{rupiah(total)}</strong>
      {:else}
        <span class="muted">Isi tanggal untuk melihat total harga.</span>
      {/if}
    </p>
    <button disabled={loading}>{loading ? 'Memproses...' : 'Pesan sekarang'}</button>
  </form>
{/if}
