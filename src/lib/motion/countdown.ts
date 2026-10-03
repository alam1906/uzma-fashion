import { gsap } from 'gsap';

// Called inside the landing's reduced-motion-aware media context, after its pins.
export function createCountdownMotion(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>('.countdown-section');
  if (!section) return () => {};

  const context = gsap.context(() => {
    gsap.from(section.querySelectorAll('[data-countdown-reveal]'), {
      y: 24,
      opacity: 0,
      duration: 1.1,
      stagger: 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 78%', once: true }
    });

    const orbit = gsap.to('.countdown-orbit', {
      rotation: 360,
      duration: 100,
      repeat: -1,
      ease: 'none',
      paused: true
    });

    let inView = false;
    const updateVisibility = () => {
      const visible = inView && !document.hidden;
      section.classList.toggle('is-countdown-visible', visible);
      orbit.paused(!visible);
    };
    // Observe the painted section, independent of pin-refresh intermediate states.
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    });
    visibility.observe(section);
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      visibility.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
      section.classList.remove('is-countdown-visible');
    };
  }, section);

  return () => context.revert();
}
