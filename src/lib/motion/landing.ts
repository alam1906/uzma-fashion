import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { goto } from '$app/navigation';

function createImageSlideReveal(frame: HTMLElement, duration = 1): gsap.core.Timeline {
  return gsap
    .timeline({ defaults: { duration, ease: 'none' } })
    .fromTo(frame, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
    .fromTo(frame.querySelector('img'), { xPercent: 6, scale: 1.12 }, { xPercent: 0, scale: 1 }, 0);
}

export function createLandingMotion(root: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

  const media = gsap.matchMedia();
  let smoother: ScrollSmoother | undefined;
  let navigatingAnchor = false;
  const context = gsap.context(() => {
    ScrollTrigger.saveStyles(root.querySelectorAll('.collection-card, .offer-panel'));
    // Smoother must exist before any triggers, and remain off for reduced motion.
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const wrapper = root.querySelector<HTMLElement>('#smooth-wrapper')!;
      smoother = ScrollSmoother.create({
        wrapper,
        content: root.querySelector<HTMLElement>('#smooth-content')!,
        smooth: 1,
        smoothTouch: 0.1,
        // The scenes use a stable large viewport. Toolbar-only changes must
        // not rebuild their pin spacers in the middle of a touch gesture.
        ignoreMobileResize: true,
        onFocusIn: (_smoother, event) =>
          navigatingAnchor || (event.target as Element).closest('#mobile-navigation')
            ? false
            : undefined
      });
      wrapper.classList.add('is-smooth');

      // Unlike browser chrome, rotation/window resizing changes the stable
      // scene dimensions. Refresh all pins together after those changes.
      // Measure outside the pinned elements: GSAP temporarily constrains their
      // max-width/max-height, which can hide a subsequent viewport expansion.
      const viewportProbe = document.createElement('div');
      viewportProbe.setAttribute('aria-hidden', 'true');
      viewportProbe.style.cssText =
        'position:fixed;inset:0 auto auto 0;width:100%;height:var(--scene-height);visibility:hidden;pointer-events:none;contain:strict;';
      root.append(viewportProbe);
      let sceneWidth = viewportProbe.offsetWidth;
      let sceneHeight = viewportProbe.offsetHeight;
      const refreshScenes = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
      const sceneResize = new ResizeObserver(() => {
        const width = viewportProbe.offsetWidth;
        const height = viewportProbe.offsetHeight;
        if (width === sceneWidth && height === sceneHeight) return;
        sceneWidth = width;
        sceneHeight = height;
        refreshScenes.restart(true);
      });
      sceneResize.observe(viewportProbe);

      return () => {
        sceneResize.disconnect();
        refreshScenes.kill();
        viewportProbe.remove();
        smoother?.kill();
        smoother = undefined;
        wrapper.classList.remove('is-smooth');
      };
    });

    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const hero = root.querySelector<HTMLElement>('.hero')!;
        const stage = root.querySelector<HTMLElement>('.hero-stage')!;
        const frame = root.querySelector<HTMLElement>('.hero-visual')!;
        const initialFrame = (property: string) =>
          getComputedStyle(stage).getPropertyValue(`--hero-frame-${property}`).trim();

        // Let Welcome enter over the pinned frame during its final viewport of travel.
        gsap.set('.page-foreground', { marginTop: 'calc(0px - var(--scene-height))' });
        gsap.set('.hero-reveal-copy', { display: 'block', autoAlpha: 0, y: 30 });
        gsap.set(frame, { xPercent: -50, x: 0 });

        const heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            pin: stage,
            start: 'top top',
            end: () => `+=${stage.offsetHeight * 2.15}`,
            scrub: true,
            refreshPriority: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        heroTimeline
          .to('.hero-title', { opacity: 0, ease: 'none', duration: 0.6 }, 0)
          .to('.hero-visual-caption', { opacity: 0, duration: 0.18 }, 0)
          .fromTo(
            frame,
            {
              width: () => initialFrame('width'),
              height: () => initialFrame('height'),
              top: () => initialFrame('top')
            },
            { width: '100%', height: '100%', top: 0, ease: 'power1.inOut', duration: 1 },
            0
          )
          .to('.hero-visual > img', { objectPosition: '50% 16%', ease: 'none', duration: 1 }, 0)
          .to('.hero-shade', { backgroundColor: 'rgba(0, 19, 28, 0.26)', duration: 0.4 }, 0.45)
          .to('.hero-reveal-copy', { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 }, 0.58)
          // Expansion takes 1.15 viewports; hold still for the covering transition.
          .to({}, { duration: 1 / 1.15 });
      },
      root
    );

    media.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        desktop: '(min-width: 769px) and (hover: hover) and (pointer: fine)',
        mobile: '(max-width: 47.99rem)'
      },
      (match) => {
        if (!match.conditions?.motion) return;
        const section = root.querySelector<HTMLElement>('.collection-section')!;
        const showcase = root.querySelector<HTMLElement>('.collection-showcase')!;
        const cards = gsap.utils.toArray<HTMLElement>('.collection-card', showcase);
        const collectionImages = cards.map((card) =>
          card.querySelector<HTMLElement>('.collection-image')!
        );
        const offerStage = root.querySelector<HTMLElement>('.offer-stage')!;
        const panels = gsap.utils.toArray<HTMLElement>('.offer-panel', offerStage);
        const offerImages = panels.map((panel) =>
          panel.querySelector<HTMLElement>('.offer-visual')!
        );
        section.classList.add('is-animated');
        showcase.classList.add('is-animated');
        offerStage.classList.add('is-animated');

        const stackOffset = match.conditions.mobile ? 8 : match.conditions.desktop ? 14 : 11;
        const activeCardY = (cards.length - 1) * stackOffset;
        const hiddenCardY = () => showcase.offsetHeight;
        const collectionTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: showcase,
            start: 'top top',
            end: () => `+=${showcase.offsetHeight * cards.length}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });
        // Initial states share the timeline so refresh and reduced-motion cleanup stay in sync.
        collectionTimeline
          .set(cards, { zIndex: (index) => index + 1, scale: 1, transformOrigin: '50% 0%' }, 0)
          .set(cards[0], { y: activeCardY }, 0)
          .set(cards.slice(1), { y: hiddenCardY }, 0)
          .addLabel('collection-01', 0);
        cards.slice(1).forEach((card, cardIndex) => {
          const index = cardIndex + 1;
          const transitionStart = index - 0.45;
          collectionTimeline
            .to(
              cards.slice(0, index),
              {
                y: (previousIndex) => activeCardY - (index - previousIndex) * stackOffset,
                scale: (previousIndex) => 1 - (index - previousIndex) * 0.05,
                duration: 0.55,
                ease: 'power3.out'
              },
              transitionStart
            )
            .to(
              card,
              {
                y: activeCardY,
                scale: 1,
                duration: 0.55,
                ease: 'power3.out'
              },
              transitionStart
            )
            .add(createImageSlideReveal(collectionImages[index], 0.35), transitionStart + 0.1)
            .addLabel(`collection-0${index + 1}`, index);
        });
        collectionTimeline.to({}, { duration: 1 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: offerStage,
              start: 'top top',
              end: () => `+=${offerStage.offsetHeight * 2.3}`,
              pin: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true
            }
          })
          .set(panels, { zIndex: (index) => index + 1 }, 0)
          .set(panels[1], { xPercent: 100 }, 0)
          .set(panels[2], { xPercent: -100 }, 0)
          .to(panels[1], { xPercent: 0, duration: 1, ease: 'none' })
          .to(panels[2], { xPercent: 0, duration: 1, ease: 'none' })
          .to({}, { duration: 0.3 })
          .add(createImageSlideReveal(offerImages[1], 0.75), 0.25)
          .add(createImageSlideReveal(offerImages[2], 0.75), 1.25);

        // First images enter vertically; later images follow their pinned parent timeline.
        // Keep each reveal under one scroll controller so it also reverses naturally.
        [
          { trigger: showcase, image: collectionImages[0] },
          { trigger: offerStage, image: offerImages[0] }
        ].forEach(({ trigger, image }) => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger,
                start: 'top 90%',
                end: 'top 15%',
                scrub: true
              }
            })
            .add(createImageSlideReveal(image));
        });

        const navigateCollection = (event: KeyboardEvent) => {
          if (
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
          )
            return;
          const trigger = collectionTimeline.scrollTrigger!;
          const current = collectionTimeline.time();
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? cards.length - 1
                : Math.round(current) + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1);
          const index = gsap.utils.clamp(0, cards.length - 1, next);
          const top =
            trigger.start + ((trigger.end - trigger.start) * index) / collectionTimeline.duration();
          event.preventDefault();
          if (smoother) smoother.scrollTo(top, true);
          else window.scrollTo({ top, behavior: 'smooth' });
        };
        showcase.addEventListener('keydown', navigateCollection);
        return () => {
          showcase.removeEventListener('keydown', navigateCollection);
          section.classList.remove('is-animated');
          showcase.classList.remove('is-animated');
          offerStage.classList.remove('is-animated');
        };
      },
      root
    );

    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const revealElements = root.querySelectorAll<HTMLElement>('[data-reveal]');
        revealElements.forEach((element) => {
          gsap.from(element, {
            y: 32,
            autoAlpha: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 94%', once: true }
          });
        });

        root.querySelectorAll<HTMLElement>('[data-story-text]').forEach((paragraph) => {
          SplitText.create(paragraph, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'story-line',
            autoSplit: true,
            aria: 'auto',
            // Returning the tween preserves progress when responsive text reflows.
            onSplit: (split) =>
              gsap.from(split.lines, {
                yPercent: 110,
                opacity: 0,
                duration: 0.9,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: { trigger: paragraph, start: 'top 88%', once: true }
              })
          });
        });

        const storyImage = root.querySelector<HTMLElement>('[data-story-image]')!;
        gsap
          .timeline({
            defaults: { duration: 1.35, ease: 'power3.inOut' },
            scrollTrigger: { trigger: storyImage, start: 'top 88%', once: true }
          })
          .fromTo(
            storyImage,
            { clipPath: 'inset(0% 100% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)' },
            0
          )
          // Slide the window so the image's own parallax transform remains independent.
          .from(storyImage.querySelector('.image-window'), { x: 48 }, 0);

        gsap.from('[data-story-word]', {
          opacity: 0.2,
          stagger: 0.15,
          ease: 'none',
          scrollTrigger: {
            trigger: '.story-heading',
            start: 'top 85%',
            end: 'bottom 43%',
            scrub: 0.7
          }
        });

        gsap.to('.story-parallax', {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.story-store',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });

        gsap.from('.hero-visual', { opacity: 0, y: 30, duration: 1.5, ease: 'power3.out' });
        gsap.from('.hero-title > span', { y: 45, opacity: 0, duration: 1.6, ease: 'power3.out' });
      },
      root
    );

    // Create after the hero pin so the transition follows the completed expansion.
    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const story = root.querySelector<HTMLElement>('.story')!;
        const desktop = () =>
          window.matchMedia('(min-width: 900px) and (min-height: 650px)').matches;

        const transition = gsap.timeline({
          scrollTrigger: {
            trigger: story,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.6,
            invalidateOnRefresh: true
          }
        });

        // Only the incoming heading drifts; the expanded hero stays pinned.
        transition.fromTo(
          '.statement',
          { y: () => window.innerHeight * (desktop() ? 0.08 : 0.03) },
          { y: 0, ease: 'none', duration: 1 },
          0
        );

        // Preserve the footer uncover effect, but clip it to its own place at
        // the end of the document so it cannot bleed behind the hero or offers.
        gsap.fromTo(
          '.sticky-footer',
          { yPercent: -100 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '.footer-reveal',
              start: 'top bottom',
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
      },
      root
    );
  }, root);

  const focusTargets = new Set<HTMLElement>();
  const navigateAnchor = async (event: MouseEvent) => {
    if (
      !smoother ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.hasAttribute('download')) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    if (location.hash !== link.hash) await goto(link.hash, { shallow: true, reset: false });
    if (disposed || !smoother) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      focusTargets.add(target);
    }
    navigatingAnchor = true;
    target.focus({ preventScroll: true });
    navigatingAnchor = false;
    smoother.scrollTo(target, true, 'top top');
  };
  root.addEventListener('click', navigateAnchor);

  const restoreHash = () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && root.contains(target)) smoother?.scrollTo(target, false, 'top top');
  };
  window.addEventListener('hashchange', restoreHash);

  // Dimensions are reserved in CSS. Refresh once after decoding the hero image.
  let disposed = false;
  const heroImage = root.querySelector<HTMLImageElement>('.hero-visual > img');
  void heroImage
    ?.decode()
    .catch(() => undefined)
    .then(() => {
      if (!disposed) {
        ScrollTrigger.refresh();
        restoreHash();
      }
    });

  return () => {
    disposed = true;
    root.removeEventListener('click', navigateAnchor);
    window.removeEventListener('hashchange', restoreHash);
    focusTargets.forEach((target) => target.removeAttribute('tabindex'));
    media.revert();
    context.revert();
  };
}
