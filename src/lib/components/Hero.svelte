<script lang="ts">
  import { event } from '#lib/data/event.js';
  import EditorialImage from './EditorialImage.svelte';
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="hero-stage">
    <h1 id="hero-title" class="hero-title" aria-label="Uzma Fashion — Grand Opening">
      <span aria-hidden="true">UZMA</span>
    </h1>

    <div class="hero-depth">
      <figure class="hero-visual">
        <EditorialImage
          name="grand-opening-store"
          alt="Interior butik Uzma Fashion dengan koleksi busana navy, ivory, dan rose"
          width={800}
          height={1000}
          sizes="100vw"
          priority
          large
        />
        <div class="hero-shade"></div>
        <div class="hero-reveal-placement" aria-hidden="true">
          <div class="hero-reveal-copy">
            <p class="eyebrow">You are invited to our</p>
            <p class="hero-reveal-title">Grand<br /><em>Opening.</em></p>
            <p class="hero-reveal-date mt-6 text-sm tracking-[0.16em]">
              {event.date} <span class="mx-3">·</span>
              {event.time}
            </p>
          </div>
        </div>
      </figure>
    </div>
  </div>
</section>
