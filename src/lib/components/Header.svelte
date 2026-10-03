<script lang="ts">
  import { event } from '#lib/data/event.js';

  let expanded = $state(false);
  let menuButton: HTMLButtonElement;

  function closeMenu(restoreFocus = false) {
    expanded = false;
    if (restoreFocus) menuButton?.focus({ preventScroll: true });
  }

  function keepLinkInPlace(event: MouseEvent) {
    // Prevent pointer focus from shifting ScrollSmoother's wrapper before click.
    event.preventDefault();
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && expanded && closeMenu(true)} />

<header class="site-header" id="top">
  <a href="#top" aria-label="Uzma Fashion, kembali ke awal" class="brand-logo">
    <img src="/logo-uzma-transparent.png" alt="" width="1737" height="905" />
  </a>
  <nav class="desktop-nav" aria-label="Navigasi utama">
    <a href="#about">Tentang</a>
    <a href="#collection">Koleksi</a>
    <a href="#privileges">Promo</a>
  </nav>
  <a href="#opening" class="header-invitation">Grand Opening</a>
  <button
    bind:this={menuButton}
    class="menu-toggle"
    type="button"
    aria-label={expanded ? 'Tutup menu' : 'Buka menu'}
    aria-expanded={expanded}
    aria-controls="mobile-navigation"
    onclick={() => (expanded = !expanded)}
  >
    <span>{expanded ? 'Tutup' : 'Menu'}</span>
    <span class:expanded class="menu-lines"><i></i><i></i></span>
  </button>
  <nav
    id="mobile-navigation"
    class="mobile-nav"
    class:is-open={expanded}
    aria-label="Navigasi ponsel"
    inert={!expanded}
  >
    <a href="#about" onmousedown={keepLinkInPlace} onclick={() => closeMenu()}>Tentang</a>
    <a href="#collection" onmousedown={keepLinkInPlace} onclick={() => closeMenu()}>Koleksi</a>
    <a href="#privileges" onmousedown={keepLinkInPlace} onclick={() => closeMenu()}>Promo</a>
    <a href="#opening" onmousedown={keepLinkInPlace} onclick={() => closeMenu()}>Grand Opening</a>
    <p class="mt-8 text-xs">{event.date} · {event.time}</p>
  </nav>
</header>
