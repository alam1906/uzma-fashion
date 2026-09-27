<script lang="ts">
  import { collections } from '#lib/data/event.js';
  import EditorialImage from './EditorialImage.svelte';
</script>

<section id="collection" class="collection-section" aria-labelledby="collection-title">
  <header class="collection-heading" data-reveal>
    <h2 id="collection-title" class="section-title">The New<br /><em>Collection</em></h2>
  </header>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (Arrow keys navigate the scroll-driven card stack.) -->
  <div
    class="collection-showcase"
    tabindex="0"
    role="region"
    aria-label="Empat koleksi Uzma Fashion"
  >
    <div class="collection-stack">
      {#each collections as collection}
        <article class="collection-card" aria-labelledby={`collection-${collection.id}`}>
          <figure class="collection-image" style:--collection-position={collection.position}>
            <EditorialImage
              name={collection.image}
              alt={collection.alt}
              width={collection.width}
              height={collection.height}
              sizes="(min-width: 768px) 52vw, 100vw"
              large={collection.image === 'grand-opening-store'}
            />
            <figcaption>{collection.category} · Look {collection.id}</figcaption>
          </figure>
          <div class="collection-copy">
            <p class="collection-number">Collection {collection.id} / 04</p>
            <h3 id={`collection-${collection.id}`}>{collection.name}</h3>
            <span>{collection.category}</span>
            <p class="collection-description">{collection.description}</p>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>
