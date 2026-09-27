<script lang="ts">
  let expanded = $state(false);
  let menuButton: HTMLButtonElement;

  function closeMenu(restoreFocus = false) {
    expanded = false;
    if (restoreFocus) menuButton?.focus({ preventScroll: true });
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && expanded && closeMenu(true)} />

<header class="site-header" id="top">
  <a href="#top" aria-label="Uzma Fashion, kembali ke awal" class="wordmark">
    uzma<span class="brand-dot">.</span><span class="wordmark-sub">FASHION</span>
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
    <a href="#about" onclick={() => closeMenu()}>Tentang</a>
    <a href="#collection" onclick={() => closeMenu()}>Koleksi</a>
    <a href="#privileges" onclick={() => closeMenu()}>Promo</a>
    <a href="#opening" onclick={() => closeMenu()}>Grand Opening</a>
    <p class="mt-8 text-xs">25 Oktober 2026 · 10.00 WIB</p>
  </nav>
</header>
