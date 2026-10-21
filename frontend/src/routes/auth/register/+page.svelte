<script>
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { setAuth } from '$lib/auth.svelte.js';

  let nama = $state('');
  let email = $state('');
  let password = $state('');
  let ulangi = $state('');
  let error = $state('');
  let loading = $state(false);

  async function daftar(e) {
    e.preventDefault();
    error = '';
    if (password !== ulangi) {
      error = 'Konfirmasi password tidak sama.';
      return;
    }
    loading = true;
    try {
      const { token, user } = await api.register(nama, email, password);
      setAuth(token, user);
      goto('/');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<h1>Daftar Akun</h1>
{#if error}<div class="alert error">{error}</div>{/if}

<form onsubmit={daftar}>
  <label>Nama lengkap <input bind:value={nama} required /></label>
  <label>Email <input type="email" bind:value={email} required autocomplete="username" /></label>
  <label>Password (min. 6 karakter) <input type="password" minlength="6" bind:value={password} required autocomplete="new-password" /></label>
  <label>Ulangi password <input type="password" bind:value={ulangi} required autocomplete="new-password" /></label>
  <button disabled={loading}>{loading ? 'Memproses...' : 'Daftar'}</button>
</form>

<p>Sudah punya akun? <a href="/auth/login">Masuk</a>.</p>
