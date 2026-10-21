<script>
  let { initial = {}, label = 'Simpan', onsubmit, oncancel } = $props();

  let nama = $state(initial.nama ?? '');
  let alamat = $state(initial.alamat ?? '');
  let kota = $state(initial.kota ?? '');
  let deskripsi = $state(initial.deskripsi ?? '');
  let nomor_kontak = $state(initial.nomor_kontak ?? '');
  let foto_url = $state(initial.foto_url ?? '');
  let loading = $state(false);

  async function kirim(e) {
    e.preventDefault();
    loading = true;
    try {
      await onsubmit({
        nama,
        alamat,
        kota,
        deskripsi: deskripsi || null,
        nomor_kontak: nomor_kontak || null,
        foto_url: foto_url || null
      });
    } finally {
      loading = false;
    }
  }
</script>

<form onsubmit={kirim}>
  <label>Nama homestay <input bind:value={nama} required /></label>
  <label>Alamat <input bind:value={alamat} required /></label>
  <label>Kota / daerah <input bind:value={kota} required /></label>
  <label>Deskripsi <textarea rows="3" bind:value={deskripsi}></textarea></label>
  <label>Nomor kontak <input bind:value={nomor_kontak} /></label>
  <label>URL foto (opsional) <input type="url" placeholder="https://..." bind:value={foto_url} /></label>
  <div class="baris">
    <button disabled={loading}>{loading ? 'Menyimpan...' : label}</button>
    {#if oncancel}<button type="button" class="sekunder" onclick={oncancel}>Batal</button>{/if}
  </div>
</form>
