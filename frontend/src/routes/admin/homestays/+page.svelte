<script>
  import { api, rupiah } from '$lib/api';
  import { goto, invalidate } from '$app/navigation';
  import HomestayForm from '$lib/HomestayForm.svelte';
  let { data } = $props();

  let tambah = $state(false);
  let error = $state('');

  async function simpan(body) {
    error = '';
    try {
      const baru = await api.createHomestay(body);
      goto(`/admin/homestays/${baru.id}`); // lanjut menambah kamar
    } catch (err) {
      error = err.message;
    }
  }

  async function hapus(h) {
    if (!confirm(`Hapus homestay "${h.nama}" beserta kamarnya?`)) return;
    error = '';
    try {
      await api.deleteHomestay(h.id);
      await invalidate('app:admin-homestays');
    } catch (err) {
      error = err.message;
    }
  }
</script>

<div class="baris" style="justify-content:space-between;margin-bottom:0.8rem">
  <h1 style="margin:0">Kelola Homestay</h1>
  {#if !tambah}<button onclick={() => (tambah = true)}>+ Tambah homestay</button>{/if}
</div>

{#if error}<div class="alert error">{error}</div>{/if}

{#if tambah}
  <div class="panel">
    <h2>Homestay baru</h2>
    <HomestayForm label="Simpan & lanjut tambah kamar" onsubmit={simpan} oncancel={() => (tambah = false)} />
  </div>
{/if}

<div class="tabel-scroll">
  <table>
    <thead>
      <tr><th>Nama</th><th>Kota</th><th>Kamar</th><th>Harga mulai</th><th>Rating</th><th>Aksi</th></tr>
    </thead>
    <tbody>
      {#each data.homestays as h (h.id)}
        <tr>
          <td><strong>{h.nama}</strong><br /><span class="muted">{h.alamat}</span></td>
          <td>{h.kota}</td>
          <td>{h.jumlah_kamar}</td>
          <td>{h.harga_mulai ? rupiah(h.harga_mulai) : '-'}</td>
          <td>{h.rata_rating ? `⭐ ${h.rata_rating}` : '-'}</td>
          <td>
            <div class="baris">
              <a href="/admin/homestays/{h.id}"><button>Kelola</button></a>
              <button class="bahaya" onclick={() => hapus(h)}>Hapus</button>
            </div>
          </td>
        </tr>
      {:else}
        <tr><td colspan="6">Belum ada homestay.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
