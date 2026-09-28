<script lang="ts">
  import EditorialImage from './EditorialImage.svelte';
</script>

<section id="about" class="story" aria-labelledby="story-title">
  <div class="story-heading">
    <h2 id="story-title" class="statement">
      <span data-story-word>Welcome to</span><br />
      <em data-story-word>Uzma Fashion.</em>
    </h2>
  </div>
  <div class="story-grid">
    <figure class="story-store" data-story-image>
      <div class="image-window">
        <EditorialImage
          name="grand-opening-store"
          alt="Interior Uzma Fashion dengan koleksi busana dan pencahayaan hangat"
          sizes="(min-width: 800px) 50vw, 100vw"
          class="story-parallax"
          large
        />
      </div>
      <figcaption>A space for quiet elegance</figcaption>
    </figure>
    <div class="story-copy">
      <p class="story-lead" data-story-text>
        Uzma Fashion adalah ruang bagi modest fashion yang anggun, modern, dan dirancang untuk
        menemani setiap perempuan tampil percaya diri.
      </p>
      <p class="story-body" data-story-text>
        Nama Uzma bermakna terbesar, terluas, dan menyeluruh. Makna ini menjadi dasar kami untuk
        menghadirkan pilihan busana dengan karakter yang kuat, detail yang lembut, dan kualitas yang
        terasa istimewa.
      </p>
    </div>
  </div>
</section>
