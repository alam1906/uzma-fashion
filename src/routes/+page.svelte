<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '#lib/components/Header.svelte';
  import Hero from '#lib/components/Hero.svelte';
  import Story from '#lib/components/Story.svelte';
  import Collections from '#lib/components/Collections.svelte';
  import Offers from '#lib/components/Offers.svelte';
  import Invitation from '#lib/components/Invitation.svelte';
  import Footer from '#lib/components/Footer.svelte';

  let root: HTMLDivElement;

  onMount(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    void import('#lib/motion/landing.js')
      .then(async ({ createLandingMotion }) => {
        await document.fonts.ready;
        if (!disposed) cleanup = createLandingMotion(root);
      })
      .catch((error: unknown) => {
        console.warn('Motion unavailable; the page remains usable.', error);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  });
</script>

<svelte:head>
  <title>Uzma Fashion · Grand Opening</title>
  <meta name="description" content="Grand Opening Uzma Fashion, 25 Oktober 2026 pukul 10.00 WIB." />
  <meta property="og:title" content="Uzma Fashion · Grand Opening" />
  <meta
    property="og:description"
    content="Grand Opening Uzma Fashion, 25 Oktober 2026 pukul 10.00 WIB."
  />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="id_ID" />
  <meta property="og:image" content="/images/uzma-hero-800.webp" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div bind:this={root} class="site-shell">
  <a class="skip-link" href="#main">Lewati ke konten utama</a>
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <div class="opening-surface">
        <Header />
      </div>
      <main id="main" tabindex="-1">
        <Hero />
        <div class="page-foreground">
          <Story />
          <Collections />
          <Offers />
          <Invitation />
        </div>
      </main>
      <div class="footer-reveal">
        <Footer />
      </div>
    </div>
  </div>
</div>
