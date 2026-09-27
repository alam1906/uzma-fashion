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
          name="uzma-hero"
          alt="Koleksi modest fashion Uzma dalam warna navy dengan sentuhan rose gold"
          width={800}
          height={1422}
          sizes="100vw"
          priority
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
        <figcaption class="hero-visual-caption">
          <span class="eyebrow">Lulu’ul de Lumière</span>
          <span class="font-display text-2xl italic">A pearl from the deep.</span>
        </figcaption>
      </figure>
    </div>
  </div>
</section>
