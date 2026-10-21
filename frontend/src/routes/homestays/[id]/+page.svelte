<script>
  import { rupiah } from '$lib/api';
  let { data } = $props();
  let h = $derived(data.homestay);
</script>

<p><a href="/">← Kembali</a></p>
{#if h.foto_url}<img class="foto-besar" src={h.foto_url} alt={h.nama} />{/if}
<h1>{h.nama}</h1>
<p class="muted">📍 {h.alamat} · ☎ {h.nomor_kontak ?? '-'}</p>
{#if h.rata_rating}<p><span class="badge">⭐ {h.rata_rating} dari {data.reviews.length} ulasan</span></p>{/if}
<p>{h.deskripsi}</p>

<h2>Kamar</h2>
<div class="grid">
  {#each data.rooms as r (r.id)}
    <div class="card">
      <h3>{r.nama_kamar}</h3>
      <p class="muted">{r.tipe} · maks. {r.kapasitas} tamu</p>
      <p><strong>{rupiah(r.harga_per_malam)}</strong> / malam</p>
      <p>
        {#each r.fasilitas as f (f.id)}<span class="badge">{f.nama}</span>{/each}
      </p>
      {#if r.status === 'tersedia'}
        <a href="/booking?room={r.id}"><button>Pesan</button></a>
      {:else}
        <span class="badge cancelled">Tidak tersedia</span>
      {/if}
    </div>
  {/each}
</div>

<h2 style="margin-top:2rem">Ulasan</h2>
{#each data.reviews as rv (rv.id)}
  <div class="card" style="margin-bottom:0.6rem">
    <strong>{rv.nama_tamu}</strong> — {'⭐'.repeat(rv.rating)}
    <p style="margin:0.3rem 0 0">{rv.komentar ?? ''}</p>
  </div>
{:else}
  <p class="muted">Belum ada ulasan.</p>
{/each}
