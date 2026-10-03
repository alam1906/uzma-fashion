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
  <div class="countdown-atmosphere" aria-hidden="true">
    <div class="countdown-halo countdown-halo-one"></div>
    <div class="countdown-halo countdown-halo-two"></div>
    <div class="countdown-orbit"><span class="countdown-pearl"></span></div>
  </div>
  <div class="countdown-panel">
    <header class="countdown-heading">
      <p class="countdown-eyebrow" data-countdown-reveal>Uzma Fashion · Grand Opening</p>
      <h2 id="invitation-title" class="countdown-title" data-countdown-reveal>
        A new <em>beginning.</em>
      </h2>
      <p class="countdown-intro" data-countdown-reveal>
        Hitung mundur menuju cerita baru yang istimewa.
      </p>
    </header>
    <div class="countdown-display">
      {#if opened}
        <p class="opened-message">Grand Opening telah dimulai</p>
      {:else}
        <div
          class="countdown"
          role="timer"
          aria-live="off"
          aria-label={`Hitung mundur menuju ${event.date} pukul ${event.time}`}
        >
          {#each countdown as part, index (part.label)}
            <div class="countdown-unit" data-countdown-reveal>
              <div class="countdown-dial">
                <span class="countdown-dial-accent" aria-hidden="true"></span>
                <span class="countdown-number-window">
                  {#key part.value}
                    <strong class="countdown-value"
                      >{part.value === null ? '—' : String(part.value).padStart(2, '0')}</strong
                    >
                  {/key}
                </span>
                <span class="countdown-label">{part.label}</span>
              </div>
              {#if index < 3}<span class="countdown-separator" aria-hidden="true">:</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="countdown-date" data-countdown-reveal>
      <span class="countdown-date-rule" aria-hidden="true"></span>
      <time datetime={event.startsAt}>
        <span>{event.day}, {event.date}</span>
        <span class="countdown-date-dot" aria-hidden="true"></span>
        <span>{event.time}</span>
      </time>
      <span class="countdown-date-rule" aria-hidden="true"></span>
    </div>
    <p class="countdown-closing" data-countdown-reveal>Kami menantikan kehadiran Anda.</p>
  </div>
</section>
