<script>
  import { rupiah } from '$lib/api';
  let { data } = $props();
  let cari = $state('');
  let hasil = $derived(
    data.homestays.filter((h) =>
      (h.nama + ' ' + h.kota).toLowerCase().includes(cari.toLowerCase())
    )
  );
</script>

<h1>Homestay Lokal</h1>
<p class="muted">Temukan penginapan di sekitar Danau Toba, Berastagi, dan sekitarnya.</p>

<p><input bind:value={cari} placeholder="Cari nama atau kota..." style="width:100%;max-width:420px" /></p>

<div class="grid">
  {#each hasil as h (h.id)}
    <a class="card" href="/homestays/{h.id}" style="color:inherit;text-decoration:none">
      {#if h.foto_url}<img class="foto" src={h.foto_url} alt={h.nama} />{/if}
      <h3>{h.nama}</h3>
      <p class="muted">📍 {h.kota} · {h.jumlah_kamar} kamar</p>
      <p>
        {#if h.rata_rating}<span class="badge">⭐ {h.rata_rating}</span>{/if}
        {#if h.harga_mulai}<span class="badge">mulai {rupiah(h.harga_mulai)}/malam</span>{/if}
      </p>
    </a>
  {:else}
    <p>Tidak ada homestay yang cocok.</p>
  {/each}
</div>
