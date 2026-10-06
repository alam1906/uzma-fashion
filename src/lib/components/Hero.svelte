<script lang="ts">
  import { event } from '#lib/data/event.js';
  import EditorialImage from './EditorialImage.svelte';
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="hero-stage">
    <div class="hero-depth">
      <figure class="hero-visual">
        <picture>
          <source
            media="(min-width: 900px)"
            srcset="/images/uzma-hero-scene-desktop-800.webp 800w, /images/uzma-hero-scene-desktop-1440.webp 1440w, /images/uzma-hero-scene-desktop-1672.webp 1672w"
            sizes="100vw"
          />
          <EditorialImage
            name="uzma-hero-scene"
            alt="Sutra navy, mutiara bercahaya, dan pantulan air"
            width={941}
            height={1672}
            sizes="100vw"
            priority
            large
            class="hero-backdrop"
          />
        </picture>
        <div class="hero-shade"></div>
        <h1
          id="hero-title"
          class="hero-title"
          aria-label={`${event.theme} — Uzma Fashion Grand Opening`}
        >
          <span aria-hidden="true">{event.theme}</span>
        </h1>
        <div class="hero-content" aria-hidden="true">
          <div class="hero-brand-mark">
            <img src="/logo-uzma-transparent.png" alt="" width="1737" height="905" />
          </div>
          <div class="hero-reveal-placement">
            <div class="hero-reveal-copy">
              <p class="eyebrow">You are invited to our</p>
              <p class="hero-reveal-title">Grand<br /><em>Opening.</em></p>
              <p class="hero-reveal-date mt-6 text-sm tracking-[0.16em]">
                {event.date} <span class="mx-3">·</span>
                {event.time}
              </p>
            </div>
          </div>
        </div>
      </figure>
    </div>
  </div>
</section>
