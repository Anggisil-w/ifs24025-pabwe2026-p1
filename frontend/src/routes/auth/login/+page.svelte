<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { api } from '$lib/api';
  import { setAuth, amanNext } from '$lib/auth.svelte.js';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function masuk(e) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const { token, user } = await api.login(email, password);
      setAuth(token, user);
      const next = amanNext(page.url.searchParams.get('next'));
      goto(next ?? '/'); // ke beranda; admin membuka menu Admin dari navbar
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<h1>Masuk</h1>
{#if error}<div class="alert error">{error}</div>{/if}

<form onsubmit={masuk}>
  <label>Email <input type="email" bind:value={email} required autocomplete="username" /></label>
  <label>Password <input type="password" bind:value={password} required autocomplete="current-password" /></label>
  <button disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</button>
</form>

<p>Belum punya akun? <a href="/auth/register">Daftar di sini</a>.</p>
