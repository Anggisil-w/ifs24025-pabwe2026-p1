<script>
  let { room = null, facilities = [], onsubmit, oncancel } = $props();

  let nama_kamar = $state(room?.nama_kamar ?? '');
  let tipe = $state(room?.tipe ?? 'Double');
  let kapasitas = $state(room?.kapasitas ?? 2);
  let harga_per_malam = $state(room?.harga_per_malam ?? 200000);
  let status = $state(room?.status ?? 'tersedia');
  let pilih = $state(room?.fasilitas?.map((f) => f.id) ?? []);
  let loading = $state(false);

  async function kirim(e) {
    e.preventDefault();
    loading = true;
    try {
      await onsubmit({
        nama_kamar,
        tipe,
        kapasitas: Number(kapasitas),
        harga_per_malam: Number(harga_per_malam),
        status,
        fasilitas: pilih
      });
    } finally {
      loading = false;
    }
  }
</script>

<form onsubmit={kirim}>
  <label>Nama kamar <input bind:value={nama_kamar} required /></label>
  <label>
    Tipe
    <select bind:value={tipe}>
      {#each ['Single', 'Double', 'Twin', 'Family'] as t (t)}<option>{t}</option>{/each}
    </select>
  </label>
  <label>Kapasitas (tamu) <input type="number" min="1" bind:value={kapasitas} required /></label>
  <label>Harga per malam (Rp) <input type="number" min="0" step="1000" bind:value={harga_per_malam} required /></label>
  <label>
    Status
    <select bind:value={status}>
      <option value="tersedia">Tersedia</option>
      <option value="nonaktif">Nonaktif</option>
    </select>
  </label>
  <div>
    <strong style="font-size:0.92rem">Fasilitas</strong>
    <div class="cek">
      {#each facilities as f (f.id)}
        <label><input type="checkbox" value={f.id} bind:group={pilih} /> {f.nama}</label>
      {/each}
    </div>
  </div>
  <div class="baris">
    <button disabled={loading}>{loading ? 'Menyimpan...' : room ? 'Simpan perubahan' : 'Tambah kamar'}</button>
    <button type="button" class="sekunder" onclick={oncancel}>Batal</button>
  </div>
</form>
