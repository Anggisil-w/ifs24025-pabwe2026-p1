<script>
  import { api } from '$lib/api';
  let { bookingId, onsaved } = $props();

  let rating = $state(5);
  let komentar = $state('');
  let error = $state('');
  let loading = $state(false);

  async function kirim(e) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      await api.createReview({ booking_id: bookingId, rating: Number(rating), komentar });
      onsaved?.();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<form onsubmit={kirim} style="margin-top:0.6rem">
  {#if error}<div class="alert error">{error}</div>{/if}
  <label>
    Rating
    <select bind:value={rating}>
      {#each [5, 4, 3, 2, 1] as n (n)}<option value={n}>{'⭐'.repeat(n)}</option>{/each}
    </select>
  </label>
  <label>Komentar <textarea rows="2" bind:value={komentar}></textarea></label>
  <button disabled={loading}>{loading ? 'Mengirim...' : 'Kirim ulasan'}</button>
</form>
