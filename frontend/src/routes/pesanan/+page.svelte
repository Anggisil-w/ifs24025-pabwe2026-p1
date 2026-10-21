<script>
  import { api, rupiah } from '$lib/api';
  import { invalidate } from '$app/navigation';
  import ReviewForm from '$lib/ReviewForm.svelte';
  let { data } = $props();
  let error = $state('');

  async function batalkan(id) {
    if (!confirm('Batalkan pemesanan ini?')) return;
    error = '';
    try {
      await api.cancelBooking(id);
      await invalidate('app:pesanan');
    } catch (err) {
      error = err.message;
    }
  }
</script>

<h1>Pesanan Saya</h1>
{#if error}<div class="alert error">{error}</div>{/if}

<div class="grid">
  {#each data.bookings as b (b.id)}
    <div class="card">
      <h3>{b.nama_homestay}</h3>
      <p class="muted">{b.nama_kamar}</p>
      <p>{b.check_in} → {b.check_out} · {b.jumlah_tamu} tamu</p>
      <p><strong>{rupiah(b.total_harga)}</strong> <span class="badge {b.status}">{b.status}</span></p>

      {#if b.status === 'pending' || b.status === 'confirmed'}
        <button class="bahaya" onclick={() => batalkan(b.id)}>Batalkan</button>
      {/if}

      {#if b.status === 'completed'}
        {#if b.sudah_diulas}
          <span class="badge">Sudah diulas</span>
        {:else}
          <ReviewForm bookingId={b.id} onsaved={() => invalidate('app:pesanan')} />
        {/if}
      {/if}
    </div>
  {:else}
    <p>Belum ada pesanan. <a href="/">Cari homestay</a>.</p>
  {/each}
</div>
