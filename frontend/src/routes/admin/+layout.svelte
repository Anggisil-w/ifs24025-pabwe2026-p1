<script>
  import { page } from '$app/state';
  let { children } = $props();
  let path = $derived(page.url.pathname);
</script>

<div class="baris" style="margin-bottom:1.2rem">
  <a href="/admin/bookings" class="tab" class:aktif={path.startsWith('/admin/bookings')}>Pemesanan</a>
  <a href="/admin/homestays" class="tab" class:aktif={path.startsWith('/admin/homestays')}>Homestay &amp; Kamar</a>
</div>

{@render children()}
