<script>
  import { page } from '$app/state';
</script>

<h1>{page.status}</h1>
<div class="alert error">{page.error?.message ?? 'Terjadi kesalahan'}</div>
<p class="muted">
  Jika pesannya soal koneksi API: pastikan back-end berjalan di terminal lain
  (<code>cd backend &amp;&amp; npm run dev</code>) dan <code>VITE_API_URL</code> di
  <code>frontend/.env</code> benar.
</p>
<p><a href="/">← Kembali ke beranda</a></p>
