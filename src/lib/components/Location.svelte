<script lang="ts">
  import { storeLocation } from '#lib/data/event.js';
</script>

<section id="location" class="location-section" aria-labelledby="location-title">
  <h2 id="location-title">Visit Our<br /><em>Store.</em></h2>
  <div class="location-map">
    <iframe
      id="store-map"
      title="Peta lokasi Uzma Fashion"
      src={storeLocation.embedUrl}
      width="600"
      height="450"
      allowfullscreen
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>
</section>

<style>
  .location-section {
    padding: clamp(64px, 8vw, 120px) clamp(20px, 5.3vw, 80px);
    background: var(--color-paper);
  }
  .location-map {
    width: 100%;
    max-width: 960px;
    height: 420px;
    margin-inline: auto;
    overflow: hidden;
    border: 1px solid #16363833;
    background: #e6e2d9;
  }
  h2 {
    margin-bottom: 40px;
    color: #163638;
    font-family: var(--font-display);
    font-size: clamp(48px, 5vw, 72px);
    font-weight: 400;
    line-height: 0.95;
    letter-spacing: -0.035em;
    text-align: center;
  }
  h2 em {
    color: #b76e79;
  }
  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
  @media (max-width: 767px) {
    .location-map {
      height: 320px;
    }
  }
</style>
