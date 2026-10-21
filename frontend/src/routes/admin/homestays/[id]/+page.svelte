<script>
  import { api, rupiah } from '$lib/api';
  import { goto, invalidate } from '$app/navigation';
  import HomestayForm from '$lib/HomestayForm.svelte';
  import RoomForm from '$lib/RoomForm.svelte';
  let { data } = $props();

  let h = $derived(data.homestay);
  let editHomestay = $state(false);
  let tambahKamar = $state(false);
  let editKamarId = $state(null);
  let error = $state('');
  let info = $state('');

  const segarkan = () => invalidate('app:admin-homestay');

  async function jalankan(fn, pesan) {
    error = '';
    info = '';
    try {
      await fn();
      if (pesan) info = pesan;
      return true;
    } catch (err) {
      error = err.message;
      return false;
    }
  }

  async function simpanHomestay(body) {
    if (await jalankan(() => api.updateHomestay(h.id, body), 'Data homestay disimpan.')) {
      editHomestay = false;
      await segarkan();
    }
  }

  async function hapusHomestay() {
    if (!confirm(`Hapus homestay "${h.nama}" beserta semua kamarnya?`)) return;
    if (await jalankan(() => api.deleteHomestay(h.id))) goto('/admin/homestays');
  }

  async function tambahRoom(body) {
    if (await jalankan(() => api.createRoom(h.id, body), 'Kamar ditambahkan.')) {
      tambahKamar = false;
      await segarkan();
    }
  }

  async function ubahRoom(id, body) {
    if (await jalankan(() => api.updateRoom(id, body), 'Kamar diperbarui.')) {
      editKamarId = null;
      await segarkan();
    }
  }

  async function hapusRoom(r) {
    if (!confirm(`Hapus kamar "${r.nama_kamar}"?`)) return;
    const ok = await jalankan(() => api.deleteRoom(r.id), 'Kamar dihapus.');
    if (ok) await segarkan();
    else error += ' Sebagai gantinya, Anda bisa menonaktifkan kamar.';
  }

  async function toggleStatus(r) {
    const status = r.status === 'tersedia' ? 'nonaktif' : 'tersedia';
    if (await jalankan(() => api.updateRoom(r.id, { status }))) await segarkan();
  }
</script>

<p><a href="/admin/homestays">← Semua homestay</a></p>

{#if error}<div class="alert error">{error}</div>{/if}
{#if info}<div class="alert ok">{info}</div>{/if}

<div class="panel">
  {#if editHomestay}
    <h2>Ubah homestay</h2>
    <HomestayForm initial={h} label="Simpan perubahan" onsubmit={simpanHomestay} oncancel={() => (editHomestay = false)} />
  {:else}
    {#if h.foto_url}<img class="foto-besar" src={h.foto_url} alt={h.nama} />{/if}
    <h1 style="margin-bottom:0.2rem">{h.nama}</h1>
    <p class="muted">📍 {h.alamat}, {h.kota} · ☎ {h.nomor_kontak ?? '-'}</p>
    <p>{h.deskripsi ?? ''}</p>
    <div class="baris">
      <button onclick={() => (editHomestay = true)}>Ubah data</button>
      <button class="bahaya" onclick={hapusHomestay}>Hapus homestay</button>
    </div>
  {/if}
</div>

<div class="baris" style="justify-content:space-between;margin-bottom:0.8rem">
  <h2 style="margin:0">Kamar ({data.rooms.length})</h2>
  {#if !tambahKamar}<button onclick={() => { tambahKamar = true; editKamarId = null; }}>+ Tambah kamar</button>{/if}
</div>

{#if tambahKamar}
  <div class="panel">
    <h3 style="margin-top:0">Kamar baru</h3>
    <RoomForm facilities={data.facilities} onsubmit={tambahRoom} oncancel={() => (tambahKamar = false)} />
  </div>
{/if}

<div class="grid">
  {#each data.rooms as r (r.id)}
    <div class="card">
      {#if editKamarId === r.id}
        <RoomForm
          room={r}
          facilities={data.facilities}
          onsubmit={(body) => ubahRoom(r.id, body)}
          oncancel={() => (editKamarId = null)}
        />
      {:else}
        <h3>{r.nama_kamar}</h3>
        <p class="muted">{r.tipe} · maks. {r.kapasitas} tamu</p>
        <p>
          <strong>{rupiah(r.harga_per_malam)}</strong> / malam
          <span class="badge {r.status === 'tersedia' ? 'completed' : 'cancelled'}">{r.status}</span>
        </p>
        <p>{#each r.fasilitas as f (f.id)}<span class="badge">{f.nama}</span>{/each}</p>
        <div class="baris">
          <button onclick={() => { editKamarId = r.id; tambahKamar = false; }}>Ubah</button>
          <button class="sekunder" onclick={() => toggleStatus(r)}>
            {r.status === 'tersedia' ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <button class="bahaya" onclick={() => hapusRoom(r)}>Hapus</button>
        </div>
      {/if}
    </div>
  {:else}
    <p>Belum ada kamar. Tambahkan kamar pertama.</p>
  {/each}
</div>
