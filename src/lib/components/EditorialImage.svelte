<script lang="ts">
  let {
    name,
    alt,
    sizes = '(min-width: 900px) 45vw, 85vw',
    width = 800,
    height = 1000,
    priority = false,
    large = false,
    class: className = ''
  } = $props<{
    name: string;
    alt: string;
    sizes?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    large?: boolean;
    class?: string;
  }>();
</script>

<img
  src={`/images/${name}-800.webp`}
  srcset={`/images/${name}-480.webp 480w, /images/${name}-800.webp 800w${large ? `, /images/${name}-1120.webp 1120w` : ''}`}
  {sizes}
  {width}
  {height}
  {alt}
  loading={priority ? 'eager' : 'lazy'}
  fetchpriority={priority ? 'high' : 'auto'}
  decoding="async"
  class={className}
/>
