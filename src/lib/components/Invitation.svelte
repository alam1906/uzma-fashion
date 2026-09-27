<script lang="ts">
  import { onMount } from 'svelte';
  import { event } from '#lib/data/event.js';

  let now = $state<number | null>(null);
  const deadline = new Date(event.startsAt).getTime();
  let remaining = $derived(now === null ? null : Math.max(0, deadline - now));
  let opened = $derived(remaining === 0);
  let countdown = $derived([
    { label: 'Hari', value: remaining === null ? null : Math.floor(remaining / 86400000) },
    { label: 'Jam', value: remaining === null ? null : Math.floor((remaining / 3600000) % 24) },
    { label: 'Menit', value: remaining === null ? null : Math.floor((remaining / 60000) % 60) },
    { label: 'Detik', value: remaining === null ? null : Math.floor((remaining / 1000) % 60) }
  ]);

  onMount(() => {
    now = Date.now();
    if (now >= deadline) return;
    const timer = window.setInterval(() => {
      now = Date.now();
      if (now >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  });
</script>

<section id="opening" class="countdown-section" aria-labelledby="invitation-title">
  <div class="countdown-panel" data-reveal>
    <h2 id="invitation-title" class="countdown-title">Countdown</h2>
    {#if opened}
      <p class="opened-message">Grand Opening telah dimulai</p>
    {:else}
      <div
        class="countdown"
        role="timer"
        aria-label={`Hitung mundur menuju ${event.date} pukul ${event.time}`}
      >
        {#each countdown as part}
          <div class="countdown-unit">
            <strong class="countdown-value"
              >{part.value === null ? '—' : String(part.value).padStart(2, '0')}</strong
            ><span class="countdown-label">{part.label}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
