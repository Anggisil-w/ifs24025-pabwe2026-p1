<script>
  import '../app.css';
  import { goto } from '$app/navigation';
  import { auth, clearAuth } from '$lib/auth.svelte.js';
  let { children } = $props();

  function keluar() {
    clearAuth();
    goto('/auth/login');
  }
</script>

<nav>
  <a class="brand" href="/">🏡 Homestay Lokal</a>
  {#if auth.user}
    <a href="/">Daftar</a>
    <a href="/cari">Cek Ketersediaan</a>
    <a href="/pesanan">Pesanan Saya</a>
    {#if auth.user.role === 'admin'}<a href="/admin/bookings">Admin</a>{/if}
    <span style="color:#fff;font-size:0.9rem">Halo, {auth.user.nama}</span>
    <button class="sekunder" onclick={keluar}>Keluar</button>
  {:else}
    <a href="/auth/login">Masuk</a>
    <a href="/auth/register">Daftar Akun</a>
  {/if}
</nav>

<main>
  {@render children()}
</main>
