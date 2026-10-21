<script>
  import { api, rupiah } from '$lib/api';
  import { invalidate } from '$app/navigation';
  let { data } = $props();
  let error = $state('');

  const aksi = {
    pending: [['confirmed', 'Konfirmasi'], ['cancelled', 'Batalkan']],
    confirmed: [['completed', 'Selesai'], ['cancelled', 'Batalkan']],
    completed: [],
    cancelled: []
  };

  async function ubah(id, status) {
    error = '';
    try {
      await api.updateBookingStatus(id, status);
      await invalidate('app:bookings');
    } catch (err) {
      error = err.message;
    }
  }
</script>

<h1>Daftar Pemesanan</h1>
{#if error}<div class="alert error">{error}</div>{/if}

<div class="tabel-scroll">
  <table>
    <thead>
      <tr><th>#</th><th>Tamu</th><th>Kamar</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr>
    </thead>
    <tbody>
      {#each data.bookings as b (b.id)}
        <tr>
          <td>{b.id}</td>
          <td>{b.nama_tamu}<br /><span class="muted">{b.email_tamu}</span></td>
          <td>{b.nama_kamar}<br /><span class="muted">{b.nama_homestay}</span></td>
          <td>{b.check_in} → {b.check_out}</td>
          <td>{rupiah(b.total_harga)}</td>
          <td><span class="badge {b.status}">{b.status}</span></td>
          <td>
            <div class="baris">
              {#each aksi[b.status] as [st, label] (st)}
                <button class={st === 'cancelled' ? 'bahaya' : ''} onclick={() => ubah(b.id, st)}>{label}</button>
              {/each}
            </div>
          </td>
        </tr>
      {:else}
        <tr><td colspan="7">Belum ada pemesanan.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
