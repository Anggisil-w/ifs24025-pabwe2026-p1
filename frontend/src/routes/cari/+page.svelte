<script>
  import { api, rupiah } from '$lib/api';

  let check_in = $state('');
  let check_out = $state('');
  let kapasitas = $state(1);
  let hasil = $state(null);
  let error = $state('');
  let loading = $state(false);

  async function cari(e) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      hasil = await api.getAvailable({ check_in, check_out, kapasitas });
    } catch (err) {
      error = err.message;
      hasil = null;
    } finally {
      loading = false;
    }
  }
</script>

<h1>Cek Ketersediaan Kamar</h1>

{#if error}<div class="alert error">{error}</div>{/if}

<form onsubmit={cari}>
  <label>Check-in <input type="date" bind:value={check_in} required /></label>
  <label>Check-out <input type="date" bind:value={check_out} required /></label>
  <label>Jumlah tamu <input type="number" min="1" bind:value={kapasitas} required /></label>
  <button disabled={loading}>{loading ? 'Mencari...' : 'Cari kamar'}</button>
</form>

{#if hasil}
  <h2 style="margin-top:1.5rem">{hasil.length} kamar tersedia</h2>
  <div class="grid">
    {#each hasil as r (r.id)}
      <div class="card">
        <h3>{r.nama_kamar}</h3>
        <p class="muted">{r.nama_homestay} · {r.kota}</p>
        <p><strong>{rupiah(r.harga_per_malam)}</strong> / malam · maks. {r.kapasitas} tamu</p>
        <a href="/booking?room={r.id}&check_in={check_in}&check_out={check_out}&tamu={kapasitas}">
          <button>Pesan</button>
        </a>
      </div>
    {/each}
  </div>
{/if}
