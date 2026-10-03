<script lang="ts">
  import { offers } from '#lib/data/event.js';
  import EditorialImage from './EditorialImage.svelte';
</script>

<section id="privileges" class="promo-section" aria-labelledby="offers-title">
  <div class="offer-stage">
    {#each offers as offer, index}
      <article class={`offer-panel offer-panel-${['one', 'two', 'three'][index]}`}>
        <div class="offer-panel-inner">
          <figure class="offer-visual">
            <EditorialImage
              name={offer.image}
              alt={offer.alt}
              sizes="(min-width: 768px) 30vw, 90vw"
            />
          </figure>
          <div class="offer-copy">
            <p class="offer-kicker">{offer.kicker}</p>
            {#if index === 0}
              <h2 id="offers-title">Special Grand<br />Opening Offers</h2>
            {/if}
            <h3 data-offer-text>
              {offer.title}{#if index > 0}<br />{:else}{' '}
              {/if}<em>{offer.italicTitle}</em>
            </h3>
            <p data-offer-text>
              {#if index === 0}
                {offer.detail}
              {:else}
                {offer.detail.split(offer.highlight)[0]}<strong>{offer.highlight}</strong
                >{offer.detail.split(offer.highlight)[1]}
              {/if}
            </p>
          </div>
        </div>
      </article>
    {/each}
  </div>
  <aside class="offer-terms" aria-label="Ketentuan penawaran">
    <p>
      *Penawaran berlaku khusus pada hari Grand Opening. Kuota hadiah terbatas dan syarat serta
      ketentuan berlaku.
    </p>
  </aside>
</section>
