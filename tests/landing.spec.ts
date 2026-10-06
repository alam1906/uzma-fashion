import { devices, expect, test, type Page } from '@playwright/test';

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
}

async function jump(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY);
  });
  await page.waitForTimeout(1200);
}

async function jumpPinned(page: Page, selector: string, progress: number) {
  await page.locator(selector).evaluate((stage, progress) => {
    const spacer = stage.parentElement!;
    const start = spacer.getBoundingClientRect().top + window.scrollY;
    const distance = spacer.getBoundingClientRect().height - stage.getBoundingClientRect().height;
    window.scrollTo(0, start + distance * progress);
  }, progress);
  await page.waitForTimeout(2200);
}

async function expectHeroLogoCentered(page: Page) {
  const frame = (await page.locator('.hero-visual').boundingBox())!;
  const logo = (await page.locator('.hero-brand-mark').boundingBox())!;
  expect(Math.abs(logo.x + logo.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(1.5);
  expect(Math.abs(logo.y + logo.height / 2 - (frame.y + frame.height / 2))).toBeLessThan(1.5);
  await expect(page.locator('.hero-brand-mark img')).toHaveAttribute(
    'src',
    '/logo-uzma-transparent.png'
  );
}

async function expectHeroLogoRightAligned(page: Page) {
  const frame = (await page.locator('.hero-visual').boundingBox())!;
  const logo = (await page.locator('.hero-brand-mark').boundingBox())!;
  const copy = (await page.locator('.hero-reveal-copy').boundingBox())!;
  const stacked = await page
    .locator('.hero-content')
    .evaluate((el) => getComputedStyle(el).flexDirection === 'column');
  if (stacked) {
    expect(Math.abs(logo.x + logo.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(1.5);
    expect(Math.abs(copy.x + copy.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(1.5);
    expect(logo.y + logo.height).toBeLessThan(copy.y);
    expect(
      Math.abs((logo.y + copy.y + copy.height) / 2 - (frame.y + frame.height / 2))
    ).toBeLessThan(1.5);
  } else {
    expect(Math.abs(logo.y + logo.height / 2 - (frame.y + frame.height / 2))).toBeLessThan(1.5);
    expect(Math.abs(copy.y + copy.height / 2 - (frame.y + frame.height / 2))).toBeLessThan(1.5);
    expect(Math.abs(copy.x - frame.x - (frame.x + frame.width - logo.x - logo.width))).toBeLessThan(
      1.5
    );
    expect(logo.x).toBeGreaterThan(copy.x + copy.width);
  }
}

async function preserveMobileLayoutViewport(page: Page) {
  // Real browser controls resize the visible viewport while svh/lvh remain
  // unchanged. A plain setViewportSize changes all three and misses this bug.
  const styles = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules, (rule) => rule.cssText))
      .join('\n')
      .replace(/([\d.]+)lvh\b/g, (_, value) => `${Number(value) * 8.52}px`)
      .replace(/([\d.]+)svh\b/g, (_, value) => `${Number(value) * 7.4}px`)
  );
  await page.addStyleTag({ content: styles });
  await page.waitForTimeout(600);
}

for (const device of [
  { name: 'desktop', width: 1366, height: 650, touch: false },
  { name: 'mobile', width: 393, height: 852, touch: true }
]) {
  test(`collection title and description reveal after 70% card entry at ${device.name}`, async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch,
      hasTouch: device.touch
    });
    const page = await context.newPage();
    await page.goto('/');
    await settle(page);
    const allLines = page.locator('[data-collection-text] .collection-reveal-line');
    expect(await allLines.count()).toBeGreaterThan(6);
    for (const line of await allLines.all()) await expect(line).toHaveCSS('opacity', '0');
    await expect(page.locator('#collection-03 .collection-reveal-line')).toHaveText([
      'New Store',
      'New Collection',
      'New Story'
    ]);

    for (const index of [0, 1, 2]) {
      const frames = await page.evaluate(async (index) => {
        const card = document.querySelectorAll('.collection-card')[index];
        let crossed70 = false;
        const visibility = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.intersectionRatio >= 0.7)) crossed70 = true;
          },
          { threshold: [0, 0.7] }
        );
        visibility.observe(card);
        const texts = Array.from(card.querySelectorAll('[data-collection-text]'));
        const sample = () =>
          texts.map((text) => {
            const lines = Array.from(text.querySelectorAll('.collection-reveal-line'));
            return {
              opacity:
                lines.reduce((sum, line) => sum + Number(getComputedStyle(line).opacity), 0) /
                lines.length,
              crossed70
            };
          });
        const frames = [sample()];
        const stage = document.querySelector('.collection-showcase')!;
        const spacer = stage.parentElement!.getBoundingClientRect();
        const distance = spacer.height - stage.getBoundingClientRect().height;
        window.scrollTo(0, scrollY + spacer.top + (distance * index) / 3);
        const started = performance.now();
        while (performance.now() - started < 2400) {
          await new Promise(requestAnimationFrame);
          frames.push(sample());
        }
        visibility.disconnect();
        return frames;
      }, index);
      for (const textIndex of [0, 1]) {
        expect(frames[0][textIndex].opacity, `card ${index + 1}: initially hidden`).toBe(0);
        expect(
          frames.some(
            (frame) => frame[textIndex].opacity > 0.01 && frame[textIndex].opacity < 0.99
          ),
          `card ${index + 1}: staggered reveal in progress`
        ).toBe(true);
        expect(frames.at(-1)![textIndex].opacity, `card ${index + 1}: fully revealed`).toBeCloseTo(
          1,
          3
        );
        for (let frameIndex = 1; frameIndex < frames.length; frameIndex++) {
          expect(frames[frameIndex][textIndex].opacity).toBeGreaterThanOrEqual(
            frames[frameIndex - 1][textIndex].opacity - 0.001
          );
          if (frames[frameIndex][textIndex].opacity > 0.01) {
            expect(
              frames[frameIndex][textIndex].crossed70,
              'starts only after 70% card entry'
            ).toBe(true);
          }
        }
      }
      // Upcoming cards must not reveal behind the current card before entry.
      for (const nextCard of await page.locator('.collection-card').all()) {
        const nextIndex = await nextCard.evaluate((card) =>
          Array.from(card.parentElement!.children).indexOf(card)
        );
        if (nextIndex <= index) continue;
        for (const line of await nextCard.locator('.collection-reveal-line').all()) {
          await expect(line).toHaveCSS('opacity', '0');
        }
      }
    }

    await page.setViewportSize({ width: device.width - 12, height: device.height });
    await page.waitForTimeout(800);
    for (const line of await page.locator('.collection-reveal-line').all()) {
      await expect(line).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('#collection-03 .collection-reveal-line')).toHaveText([
      'New Store',
      'New Collection',
      'New Story'
    ]);
    await page.screenshot({ path: `test-results/${device.name}-collection-text-reveal.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.collection-reveal-line')).toHaveCount(0);
    await expect(page.locator('#collection-03')).toHaveText('New Store\nNew Collection\nNew Story');
    await context.close();
  });

  test(`offer titles and descriptions reveal after 70% panel entry at ${device.name}`, async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch,
      hasTouch: device.touch
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await settle(page);
    const texts = page.locator('[data-offer-text]');
    await expect(texts).toHaveCount(6);
    const splitHeights = await texts.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height)
    );
    for (const line of await page.locator('.offer-reveal-line').all()) {
      await expect(line).toHaveCSS('opacity', '0');
    }

    for (const index of [0, 1, 2]) {
      const frames = await page.evaluate(async (index) => {
        const panel = document.querySelectorAll('.offer-panel')[index];
        let crossed70 = false;
        const visibility = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.intersectionRatio >= 0.7)) crossed70 = true;
          },
          { threshold: [0, 0.7] }
        );
        visibility.observe(panel);
        const texts = Array.from(panel.querySelectorAll('[data-offer-text]'));
        const sample = () =>
          texts.map((text) => {
            const lines = Array.from(text.querySelectorAll('.offer-reveal-line'));
            return {
              opacity:
                lines.reduce((sum, line) => sum + Number(getComputedStyle(line).opacity), 0) /
                lines.length,
              crossed70
            };
          });
        const frames = [sample()];
        const stage = document.querySelector('.offer-stage')!;
        const spacer = stage.parentElement!.getBoundingClientRect();
        const distance = spacer.height - stage.getBoundingClientRect().height;
        window.scrollTo(0, scrollY + spacer.top + (distance * index) / 2.3);
        const started = performance.now();
        while (performance.now() - started < 2400) {
          await new Promise(requestAnimationFrame);
          frames.push(sample());
        }
        visibility.disconnect();
        return frames;
      }, index);
      for (const textIndex of [0, 1]) {
        expect(frames[0][textIndex].opacity, `panel ${index + 1}: initially hidden`).toBe(0);
        expect(
          frames.some(
            (frame) => frame[textIndex].opacity > 0.01 && frame[textIndex].opacity < 0.99
          ),
          `panel ${index + 1}: text reveal in progress`
        ).toBe(true);
        expect(frames.at(-1)![textIndex].opacity, `panel ${index + 1}: fully revealed`).toBeCloseTo(
          1,
          3
        );
        for (let frameIndex = 1; frameIndex < frames.length; frameIndex++) {
          expect(frames[frameIndex][textIndex].opacity).toBeGreaterThanOrEqual(
            frames[frameIndex - 1][textIndex].opacity - 0.001
          );
          if (frames[frameIndex][textIndex].opacity > 0.01) {
            expect(
              frames[frameIndex][textIndex].crossed70,
              'starts only after 70% panel entry'
            ).toBe(true);
          }
        }
      }
      for (const upcoming of await page.locator('.offer-panel').all()) {
        const nextIndex = await upcoming.evaluate((panel) =>
          Array.from(panel.parentElement!.children).indexOf(panel)
        );
        if (nextIndex <= index) continue;
        for (const line of await upcoming.locator('.offer-reveal-line').all()) {
          await expect(line).toHaveCSS('opacity', '0');
        }
      }
    }

    await page.screenshot({ path: `test-results/${device.name}-offer-text-reveal.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.offer-reveal-line')).toHaveCount(0);
    const staticHeights = await texts.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height)
    );
    for (const [index, height] of splitHeights.entries()) {
      expect(Math.abs(height - staticHeights[index]), 'reveal preserves text layout').toBeLessThan(
        1
      );
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await settle(page);
    await jumpPinned(page, '.offer-stage', 2 / 2.3);
    await page.setViewportSize({ width: device.width - 12, height: device.height });
    await page.waitForTimeout(800);
    for (const line of await page.locator('.offer-panel-three .offer-reveal-line').all()) {
      await expect(line).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('.offer-panel-three strong')).toHaveCSS(
      'color',
      'rgb(183, 110, 121)'
    );
    expect(errors).toEqual([]);
    await context.close();
  });

  test(`panel text remains hidden at 60% and reveals at 75% visibility at ${device.name}`, async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch,
      hasTouch: device.touch
    });
    const page = await context.newPage();
    try {
      for (const selector of ['.collection-card', '.offer-panel']) {
        await page.goto('/');
        await settle(page);
        const panel = page.locator(selector).first();
        for (const ratio of [0.6, 0.75]) {
          await panel.evaluate((element, ratio) => {
            const bounds = element.getBoundingClientRect();
            window.scrollTo(0, scrollY + bounds.top - (innerHeight - bounds.height * ratio));
          }, ratio);
          await page.waitForTimeout(1400);
          const actualRatio = await panel.evaluate(
            (element) =>
              new Promise<number>((resolve) => {
                const observer = new IntersectionObserver((entries) => {
                  resolve(entries[0].intersectionRatio);
                  observer.disconnect();
                });
                observer.observe(element);
              })
          );
          expect(actualRatio).toBeCloseTo(ratio, 1);
          for (const line of await panel
            .locator('.collection-reveal-line,.offer-reveal-line')
            .all()) {
            await expect(line).toHaveCSS('opacity', ratio < 0.7 ? '0' : '1');
          }
        }
      }
    } finally {
      await context.close();
    }
  });

  test(`Welcome image and text remain concealed until their reveal at ${device.name}`, async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch,
      hasTouch: device.touch
    });
    let page = await context.newPage();
    await page.goto('/');
    await settle(page);

    const expectConcealed = async () => {
      const images = page.locator('[data-story-image], .collection-image, .offer-visual');
      for (const image of await images.all()) {
        await expect(image).toHaveCSS('clip-path', 'inset(0% 100% 0% 0%)');
      }
      const lines = page.locator('[data-story-text] .story-line');
      expect(await lines.count()).toBeGreaterThan(0);
      for (const line of await lines.all()) await expect(line).toHaveCSS('opacity', '0');
    };
    await expectConcealed();
    // A refresh/re-split before entry must not restore the visible source styles.
    await page.setViewportSize({ width: device.width - 12, height: device.height });
    await page.waitForTimeout(800);
    await expectConcealed();

    const reveal = async (selector: string, image: boolean) => {
      // Each once-only reveal needs a fresh visit; the image entrance can
      // legitimately also start the adjacent paragraph on desktop.
      if (!image) {
        await page.close();
        page = await context.newPage();
        await page.goto('/');
        await settle(page);
      }
      await page.locator(selector).evaluate((element) => {
        window.scrollTo(
          0,
          window.scrollY + element.getBoundingClientRect().top - innerHeight * 0.94
        );
      });
      await page.waitForTimeout(1200);
      if (image) {
        await expect(page.locator(selector)).toHaveCSS('clip-path', 'inset(0% 100% 0% 0%)');
      } else {
        for (const line of await page.locator(`${selector} .story-line`).all()) {
          await expect(line).toHaveCSS('opacity', '0');
        }
      }

      const frames = await page.evaluate(
        async ({ selector, image }) => {
          const target = document.querySelector(selector)!;
          const sample = () => {
            if (image) {
              const percentages = getComputedStyle(target).clipPath.match(/[\d.]+(?=%)/g)!;
              return 1 - Number(percentages[1] ?? percentages[0]) / 100;
            }
            const lines = Array.from(target.querySelectorAll('.story-line'));
            return (
              lines.reduce((sum, line) => sum + Number(getComputedStyle(line).opacity), 0) /
              lines.length
            );
          };
          const frames = [sample()];
          window.scrollTo(
            0,
            window.scrollY + target.getBoundingClientRect().top - innerHeight * 0.68
          );
          const started = performance.now();
          while (performance.now() - started < 2200) {
            await new Promise(requestAnimationFrame);
            frames.push(sample());
          }
          return frames;
        },
        { selector, image }
      );
      expect(frames[0], `${selector}: concealed before entry`).toBe(0);
      expect(
        frames.some((value) => value > 0.01 && value < 0.99),
        `${selector}: slide in progress`
      ).toBe(true);
      expect(frames.at(-1), `${selector}: fully revealed`).toBeCloseTo(1, 3);
      for (let index = 1; index < frames.length; index++) {
        expect(
          frames[index],
          `${selector}: never flash visible then disappear`
        ).toBeGreaterThanOrEqual(frames[index - 1] - 0.001);
      }
    };

    await reveal('[data-story-image]', true);
    await reveal('.story-lead', false);
    await reveal('.story-body', false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('[data-story-image]')).toHaveCSS('clip-path', 'none');
    await expect(page.locator('.story-lead')).toHaveCSS('opacity', '1');
    await expect(page.locator('.story-line')).toHaveCount(0);
    await context.close();
  });

  test(`hero title stays inside the opaque image during entrance and scroll at ${device.name}`, async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch,
      hasTouch: device.touch
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const frames: { opacity: number; ordered: boolean; imageOnTop: boolean }[] = [];
      Object.defineProperty(window, 'heroLayerFrames', { value: frames });
      const sample = () => {
        const stage = document.querySelector('.hero-stage');
        const title = document.querySelector('.hero-title');
        const image = document.querySelector('.hero-visual');
        if (stage && title && image) {
          const bounds = image.getBoundingClientRect();
          const titleBounds = title.getBoundingClientRect();
          const x = bounds.left + bounds.width / 2;
          const y = bounds.top + bounds.height * 0.4;
          if (x > 0 && x < innerWidth && y > 0 && y < innerHeight) {
            frames.push({
              opacity: Number(getComputedStyle(image).opacity),
              ordered:
                getComputedStyle(stage).isolation === 'isolate' &&
                image.contains(title) &&
                Number(getComputedStyle(title).zIndex) > 0 &&
                titleBounds.left >= bounds.left - 1 &&
                titleBounds.right <= bounds.right + 1 &&
                titleBounds.top >= bounds.top &&
                titleBounds.bottom <= bounds.bottom,
              imageOnTop: Boolean(document.elementFromPoint(x, y)?.closest('.hero-visual'))
            });
          }
        }
        if (performance.now() < 10000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto('/');
    await settle(page);
    const title = page.locator('.hero-title');
    const text = title.locator('span');
    const initialText = (await text.boundingBox())!;
    let previousWidth = initialText.width;
    for (const progress of [0.25, 0.5]) {
      await jumpPinned(page, '.hero-stage', progress);
      await expect(title).toHaveCSS('opacity', '1');
      await expect(text).toHaveCSS('opacity', '1');
      const bounds = (await text.boundingBox())!;
      const image = (await page.locator('.hero-visual').boundingBox())!;
      expect(bounds.width).toBeGreaterThan(previousWidth);
      expect(bounds.x).toBeGreaterThanOrEqual(image.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(image.x + image.width);
      previousWidth = bounds.width;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1400);
    expect((await text.boundingBox())!.width).toBeCloseTo(initialText.width, 0);
    const frames = await page.evaluate(
      () =>
        (
          window as Window & {
            heroLayerFrames?: { opacity: number; ordered: boolean; imageOnTop: boolean }[];
          }
        ).heroLayerFrames ?? []
    );
    expect(frames.length).toBeGreaterThan(60);
    expect(
      frames.every((frame) => frame.opacity === 1),
      'image never becomes transparent'
    ).toBe(true);
    expect(
      frames.every((frame) => frame.ordered),
      'hero title is overlaid within the image bounds'
    ).toBe(true);
    expect(
      frames.every((frame) => frame.imageOnTop),
      'image is the foreground on every frame'
    ).toBe(true);
    await context.close();
  });
}

test('reference card stack and alternating offer panels follow scroll', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await jump(page, '#collection');
  await page.screenshot({ path: 'test-results/desktop-collection-heading.png' });
  await expect(page.locator('#collection')).toHaveCSS('background-color', 'rgb(6, 19, 29)');
  const initiallyHidden = await page.locator('.collection-card').last().boundingBox();
  expect(initiallyHidden!.y).toBeGreaterThan(1000);
  await expect(page.locator('.collection-card').first()).toHaveCSS('z-index', '1');
  expect((await page.locator('.offer-panel').last().boundingBox())!.x).toBeLessThan(-1400);
  await jumpPinned(page, '.collection-showcase', 1 / 3);
  const active = await page.locator('.collection-card').nth(1).boundingBox();
  expect(active!.y).toBeGreaterThan(90);
  expect(active!.y).toBeLessThan(130);
  const previousScale = await page
    .locator('.collection-card')
    .first()
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
  expect(previousScale).toBeCloseTo(0.95, 2);
  const gallery = page.getByRole('region', { name: '3 koleksi Uzma Fashion' });
  await gallery.focus();
  await page.keyboard.press('End');
  await page.waitForTimeout(2200);
  expect((await page.locator('.collection-card').last().boundingBox())!.y).toBeLessThan(130);
  await page.screenshot({ path: 'test-results/desktop-collection-stack.png' });
  for (const [index, progress] of [0, 1 / 2.3, 2 / 2.3].entries()) {
    await jumpPinned(page, '.offer-stage', progress);
    const panel = await page.locator('.offer-panel').nth(index).boundingBox();
    expect(Math.abs(panel!.x)).toBeLessThan(2);
    expect(panel!.y).toBeCloseTo(0, 0);
    expect(panel!.height).toBeCloseTo(1000, 0);
    expect(
      await page.evaluate(
        () =>
          document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.offer-panel')
            ?.className
      )
    ).toContain(['offer-panel-one', 'offer-panel-two', 'offer-panel-three'][index]);
    await page.screenshot({ path: `test-results/desktop-offer-${index + 1}.png` });
  }
});

test('content, images, countdown, and footer work in the production build', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
  });
  const missingResources: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) missingResources.push(response.url());
  });

  await page.goto('/');
  await settle(page);
  await expect(page).toHaveTitle(/Uzma Fashion/);
  await expect(page.locator('.brand-logo img')).toBeVisible();
  await expect(page.locator('.header-invitation')).toHaveAttribute('href', '#opening');
  await expect(page.locator('.header-invitation')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/Grand Opening/);
  await expect(page.locator('.collection-card')).toHaveCount(3);
  await expect(page.locator('.offer-panel')).toHaveCount(3);
  await expect(page.locator('[data-offer-text]')).toHaveCount(6);
  expect(await page.locator('.offer-reveal-line').count()).toBeGreaterThan(0);
  expect(
    await page.locator('.hero-backdrop').evaluate((image: HTMLImageElement) => image.currentSrc)
  ).toContain('/images/uzma-hero-scene-desktop-');

  // Decode every image, including covered and below-the-fold lazy images.
  const brokenImages = await page.locator('img').evaluateAll(async (images) => {
    const results = await Promise.all(
      images.map(async (image) => {
        if (!(image instanceof HTMLImageElement)) return 'Unexpected image element';
        image.loading = 'eager';
        try {
          await image.decode();
        } catch {
          return image.currentSrc || image.src;
        }
        return image.naturalWidth > 0 ? null : image.currentSrc;
      })
    );
    return results.filter(Boolean);
  });
  expect(brokenImages).toEqual([]);
  await jump(page, '#privileges');
  await expect(
    page.getByText('Untuk 20 pembeli pertama dengan minimal transaksi Rp300.000.')
  ).toBeVisible();
  await expect(
    page.getByText(
      'Rayakan Grand Opening dengan hadiah spesial untuk 10 pembeli pertama, dengan minimal belanja Rp500.000.'
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      'Jadilah salah satu dari 3 pembeli pertama dan dapatkan voucher belanja Rp50.000 dengan minimal belanja Rp1.000.000.'
    )
  ).toBeVisible();
  await jump(page, '#opening');
  await expect(page.getByRole('heading', { name: 'A new beginning.' })).toBeVisible();
  await expect(page.locator('.countdown-date time')).toHaveAttribute(
    'datetime',
    '2026-10-08T09:00:00+07:00'
  );
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/desktop-countdown.png' });
  await expect(page.getByRole('link', { name: 'Simpan tanggalnya' })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1400);
  await expect(page.getByText('Coming Soon', { exact: true })).toHaveCount(0);
  await expect(page.getByText('© 2026 UZMA FASHION', { exact: true })).toBeVisible();
  expect(
    await page.locator('.sticky-footer').evaluate((footer) => footer.clientHeight)
  ).toBeLessThan(120);
  await page.screenshot({ path: 'test-results/desktop-footer.png' });
  expect(errors).toEqual([]);
  expect(missingResources).toEqual([]);
});

for (const touch of [false, true]) {
  test(`reload restarts the hero at the top on ${touch ? 'mobile' : 'desktop'}`, async ({
    browser
  }) => {
    const context = await browser.newContext({
      viewport: touch ? { width: 393, height: 852 } : { width: 1440, height: 1000 },
      isMobile: touch,
      hasTouch: touch
    });
    const page = await context.newPage();
    await page.goto('/');
    await settle(page);
    await jumpPinned(page, '.hero-stage', 0.6);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await page.reload();
    await settle(page);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(1);
    await expectHeroLogoCentered(page);
    await expect(page.locator('.hero-reveal-copy')).toHaveCSS('visibility', 'hidden');
    await expect(page.locator('.site-header')).toBeInViewport();

    // Reloading a menu destination must restart too, but menu clicks still work.
    if (touch) await page.getByRole('button', { name: 'Buka menu' }).click();
    await page
      .getByRole('navigation', { name: touch ? 'Navigasi ponsel' : 'Navigasi utama' })
      .getByRole('link', { name: 'Tentang' })
      .click();
    await expect(page).toHaveURL(/#about$/);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await page.reload();
    await settle(page);
    expect(new URL(page.url()).hash).toBe('');
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(1);
    await expectHeroLogoCentered(page);
    await expect(page.locator('.site-header')).toBeInViewport();
    await context.close();
  });
}

test('smooth scrolling holds the expanded hero while Welcome covers it', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await expectHeroLogoCentered(page);
  await expect(page.locator('#smooth-wrapper')).toHaveCSS('position', 'fixed');
  const initialWidth = await page
    .locator('.hero-visual')
    .evaluate((el) => el.getBoundingClientRect().width);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 1050);
  });
  await page.waitForTimeout(1500);
  const expandedWidth = await page
    .locator('.hero-visual')
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(expandedWidth).toBeGreaterThan(initialWidth * 2.5);
  await expect(page.locator('.hero-reveal-copy')).toHaveCSS('visibility', 'visible');

  // The final frame must touch every viewport edge, including after resizing.
  for (const size of [
    { width: 1366, height: 768 },
    { width: 2560, height: 1440 },
    { width: 393, height: 852 },
    { width: 852, height: 393 },
    { width: 1440, height: 1000 }
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(400);
    if (size.width === 393 || size.width === 852) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1200);
      const initialFrame = await page.locator('.hero-visual').boundingBox();
      expect(initialFrame!.width).toBeCloseTo(size.width * (size.width === 393 ? 0.74 : 0.46), 0);
    }
    await page.locator('.hero').evaluate((hero) => {
      const stage = hero.querySelector('.hero-stage')!;
      const start = hero.getBoundingClientRect().top + window.scrollY;
      const end = start + stage.getBoundingClientRect().height * 1.15;
      window.scrollTo(0, end - 1);
    });
    await page.waitForTimeout(1400);
    const frame = await page.locator('.hero-visual').boundingBox();
    expect(Math.abs(frame!.x)).toBeLessThan(1.5);
    expect(Math.abs(frame!.y)).toBeLessThan(1.5);
    expect(Math.abs(frame!.width - size.width)).toBeLessThan(1.5);
    expect(Math.abs(frame!.height - size.height)).toBeLessThan(1.5);
    await expectHeroLogoRightAligned(page);
    const date = await page.locator('.hero-reveal-date').boundingBox();
    expect(date!.y + date!.height).toBeLessThan(size.height);
  }
  await page.screenshot({ path: 'test-results/desktop-expanded.png' });

  const transitionStart = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
  await page.waitForTimeout(1200);
  const frameDuringTransition = await page.locator('.hero-visual').boundingBox();
  const storyDuringTransition = await page.locator('#about').boundingBox();
  expect(Math.abs(frameDuringTransition!.y)).toBeLessThan(1.5);
  expect(frameDuringTransition!.height).toBeCloseTo(1000, 0);
  expect(storyDuringTransition!.y).toBeGreaterThan(450);
  expect(storyDuringTransition!.y).toBeLessThan(550);
  expect(
    await page.evaluate(() =>
      Boolean(document.elementFromPoint(innerWidth / 2, innerHeight * 0.75)?.closest('#about'))
    )
  ).toBe(true);
  await page.screenshot({ path: 'test-results/hero-welcome-overlay.png' });
  await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2 + 2));
  await page.waitForTimeout(1200);
  expect(
    await page.evaluate(() =>
      Boolean(document.elementFromPoint(innerWidth / 2, 10)?.closest('#about'))
    )
  ).toBe(true);
  await page.evaluate((top) => window.scrollTo(0, top), transitionStart);
  await page.waitForTimeout(1200);
  const restoredFrame = await page.locator('.hero-visual').boundingBox();
  expect(Math.abs(restoredFrame!.y)).toBeLessThan(1.5);
});

test.describe('touchscreen hero', () => {
  test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 1 });

  for (const size of [
    { width: 393, height: 852 },
    { width: 320, height: 568 }
  ]) {
    test(`expands, stays pinned, and reverses at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await settle(page);
      await expect(page.locator('.pin-spacer')).toHaveCount(3);
      expect(
        await page.locator('.hero-backdrop').evaluate((image: HTMLImageElement) => image.currentSrc)
      ).toMatch(/\/images\/uzma-hero-scene-\d+\.webp$/);
      const initial = await page.locator('.hero-visual').boundingBox();
      expect(initial!.width).toBeCloseTo(size.width * 0.74, 0);
      expect(initial!.height).toBeCloseTo(size.height * 0.64, 0);
      await expectHeroLogoCentered(page);
      await page.screenshot({ path: `test-results/mobile-${size.width}-initial.png` });

      await jumpPinned(page, '.hero-stage', 0.5 / 2.15);
      const growing = await page.locator('.hero-visual').boundingBox();
      expect(growing!.width).toBeGreaterThan(initial!.width);
      expect(growing!.width).toBeLessThan(size.width);
      expect(growing!.x).toBeCloseTo((size.width - growing!.width) / 2, 0);

      await jumpPinned(page, '.hero-stage', 1.15 / 2.15);
      const expanded = await page.locator('.hero-visual').boundingBox();
      expect(Math.abs(expanded!.x)).toBeLessThan(1.5);
      expect(Math.abs(expanded!.y)).toBeLessThan(1.5);
      expect(expanded!.width).toBeCloseTo(size.width, 0);
      expect(expanded!.height).toBeCloseTo(size.height, 0);
      await expectHeroLogoRightAligned(page);
      await expect(page.locator('.hero-reveal-copy')).toHaveCSS('visibility', 'visible');
      const date = await page.locator('.hero-reveal-date').boundingBox();
      expect(date!.x + date!.width).toBeLessThan(size.width);
      expect(date!.y + date!.height).toBeLessThan(size.height);
      await page.screenshot({ path: `test-results/mobile-${size.width}-expanded.png` });

      await jumpPinned(page, '.hero-stage', 1.65 / 2.15);
      expect(Math.abs((await page.locator('.hero-visual').boundingBox())!.y)).toBeLessThan(1.5);
      expect((await page.locator('#about').boundingBox())!.y).toBeCloseTo(size.height / 2, 0);
      expect(
        await page.evaluate(() =>
          Boolean(document.elementFromPoint(innerWidth / 2, innerHeight * 0.75)?.closest('#about'))
        )
      ).toBe(true);
      await page.screenshot({ path: `test-results/mobile-${size.width}-welcome.png` });

      await jumpPinned(page, '.hero-stage', 0);
      const restored = await page.locator('.hero-visual').boundingBox();
      expect(restored!.width).toBeCloseTo(initial!.width, 0);
      expect(restored!.x).toBeCloseTo(initial!.x, 0);
      await expectHeroLogoCentered(page);
      expect(await page.evaluate(() => document.body.scrollWidth)).toBe(size.width);

      // Browser toolbar changes are smaller than an orientation change.
      const shorter = size.height - 70;
      await page.setViewportSize({ width: size.width, height: shorter });
      await page.waitForTimeout(500);
      await jumpPinned(page, '.hero-stage', 1.15 / 2.15);
      expect((await page.locator('.hero-visual').boundingBox())!.height).toBeCloseTo(shorter, 0);
      await expectHeroLogoRightAligned(page);
      const dateAfterResize = await page.locator('.hero-reveal-date').boundingBox();
      expect(dateAfterResize!.y + dateAfterResize!.height).toBeLessThan(shorter);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.pin-spacer')).toHaveCount(0);
      await expect(page.locator('.page-foreground')).toHaveCSS('margin-top', '0px');
      await expect(page.locator('.hero-title')).toHaveCSS('opacity', '1');
    });
  }
});

test('GSAP smooths native scrolling and anchor links reach the correct sections', async ({
  page
}) => {
  await page.goto('/');
  await settle(page);
  const lag = await page.evaluate(async () => {
    window.scrollTo(0, 700);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const transform = getComputedStyle(document.getElementById('smooth-content')!).transform;
    return window.scrollY + new DOMMatrixReadOnly(transform).m42;
  });
  expect(lag).toBeGreaterThan(10);
  await page.waitForTimeout(1400);
  const settledLag = await page
    .locator('#smooth-content')
    .evaluate(
      (content) => window.scrollY + new DOMMatrixReadOnly(getComputedStyle(content).transform).m42
    );
  expect(Math.abs(settledLag)).toBeLessThan(2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page
    .getByRole('navigation', { name: 'Navigasi utama' })
    .getByRole('link', { name: 'Tentang' })
    .click();
  await expect(page).toHaveURL(/#about$/);
  await page.waitForTimeout(1500);
  expect(Math.abs((await page.locator('#about').boundingBox())!.y)).toBeLessThan(2);
  await expect(page.locator('#about')).toBeFocused();
  await page.reload();
  await settle(page);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(1);
  await expectHeroLogoCentered(page);
});

test('mobile navigation, card stack, and countdown remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await settle(page);
  await expect(page.locator('.brand-logo img')).toBeVisible();
  await expect(page.locator('.header-invitation')).toBeHidden();
  await page.screenshot({ path: 'test-results/mobile-hero.png' });
  await page.getByRole('button', { name: 'Buka menu' }).click();
  await expect(page.getByRole('button', { name: 'Tutup menu' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Buka menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Buka menu' }).click();
  await page
    .getByRole('navigation', { name: 'Navigasi ponsel' })
    .getByRole('link', { name: /^Koleksi/ })
    .click();
  await expect(page).toHaveURL(/#collection$/);
  await expect(page.getByRole('button', { name: 'Buka menu' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  await page.waitForTimeout(1200);
  await jumpPinned(page, '.collection-showcase', 0.75);
  const lastCard = await page.locator('.collection-card').last().boundingBox();
  expect(lastCard!.x).toBeGreaterThanOrEqual(0);
  expect(lastCard!.x + lastCard!.width).toBeLessThanOrEqual(391);
  expect(lastCard!.y).toBeLessThan(150);
  await page.screenshot({ path: 'test-results/mobile-collection.png' });
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(390);
  await jump(page, '#opening');
  // The dial entrance is staggered; measure the grid after every dial settles.
  await expect
    .poll(() =>
      page
        .locator('.countdown-unit')
        .last()
        .evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)
    )
    .toBe(0);
  await page.screenshot({ path: 'test-results/mobile-opening.png' });
  await expect(page.getByRole('heading', { name: 'A new beginning.' })).toBeVisible();
  const units = await page.locator('.countdown-unit').evaluateAll((elements) =>
    elements.map((element) => ({
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y
    }))
  );
  expect(units[0].y).toEqual(units[1].y);
  expect(units[2].y).toBeGreaterThan(units[0].y);
});

test('mobile navigation links also work with touch input', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto('/');
  await settle(page);
  await page.getByRole('button', { name: 'Buka menu' }).tap();
  await page
    .getByRole('navigation', { name: 'Navigasi ponsel' })
    .getByRole('link', { name: /^Koleksi/ })
    .tap();
  await expect(page).toHaveURL(/#collection$/);
  await expect(page.getByRole('button', { name: 'Buka menu' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  await context.close();
});

test('mobile offer panels cover the viewport while pinned and after viewport resize', async ({
  browser
}) => {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto('/');
  await settle(page);
  await jumpPinned(page, '.offer-stage', 0.7 / 2.3);

  for (const height of [852, 740, 852]) {
    await page.setViewportSize({ width: 393, height });
    await page.waitForTimeout(600);
    const coverage = await page.locator('.offer-stage').evaluate((stage) => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const bounds = stage.getBoundingClientRect();
      const covers = (y: number) =>
        Boolean(document.elementFromPoint(window.innerWidth / 2, y)?.closest('.offer-panel'));
      return {
        viewportHeight,
        top: bounds.top,
        height: bounds.height,
        topCovered: covers(1),
        bottomCovered: covers(viewportHeight - 2)
      };
    });
    expect(Math.abs(coverage.top)).toBeLessThan(2);
    expect(Math.abs(coverage.height - coverage.viewportHeight)).toBeLessThan(2);
    expect(coverage.topCovered).toBe(true);
    expect(coverage.bottomCovered).toBe(true);
  }
  await context.close();
});

test('mobile footer stays at the end during scrolling and browser-height changes', async ({
  browser
}) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    viewport: { width: 393, height: 740 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await settle(page);

  for (const [stage, progress] of [
    ['.hero-stage', 1.15 / 2.15],
    ['.collection-showcase', 0.5],
    ['.offer-stage', 0.7 / 2.3],
    ['.hero-stage', 0.3]
  ] as const) {
    await jumpPinned(page, stage, progress);
    for (const height of [852, 790, 740]) {
      await page.setViewportSize({ width: 393, height });
      // Check immediately as well as after the resize has settled; a fixed
      // footer behind the whole page can leak through during either state.
      await expect(page.locator('.footer-copyright')).not.toBeInViewport();
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollBy(0, 16));
      await page.waitForTimeout(250);
      await expect(page.locator('.footer-copyright')).not.toBeInViewport();
    }
  }

  // The compact footer appears at the actual bottom of the page, then disappears
  // again when returning to the hero (including with reduced motion).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('.footer-copyright')).toBeInViewport();
  await expect(page.getByText('Coming Soon', { exact: true })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.footer-copyright')).not.toBeInViewport();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.footer-copyright')).not.toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('.footer-copyright')).toBeInViewport();
  expect(errors).toEqual([]);
  await context.close();
});

test('mobile browser controls leave no blank strip in pinned sections or below the footer', async ({
  browser
}) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    viewport: { width: 393, height: 740 },
    isMobile: true,
    hasTouch: true,
    userAgent: devices['Pixel 7'].userAgent
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await settle(page);
  await preserveMobileLayoutViewport(page);

  for (const [selector, progress] of [
    ['.hero-stage', 1.15 / 2.15],
    ['.collection-showcase', 0.5],
    ['.offer-stage', 0.7 / 2.3]
  ] as const) {
    await jumpPinned(page, selector, progress);
    for (const height of [740, 852, 790, 740]) {
      await page.setViewportSize({ width: 393, height });
      await page.waitForTimeout(100);
      const coverage = await page.locator(selector).evaluate((stage, selector) => {
        const bounds = stage.getBoundingClientRect();
        const viewport = window.visualViewport!;
        return {
          top: bounds.top,
          bottom: bounds.bottom,
          visibleBottom: viewport.height,
          bottomPainted: Boolean(
            document
              .elementFromPoint(innerWidth / 2, viewport.height - 2)
              ?.closest(selector === '.hero-stage' ? '.hero-stage,.page-foreground' : selector)
          )
        };
      }, selector);
      expect(Math.abs(coverage.top), `${selector}: pinned top at ${height}px`).toBeLessThan(2);
      expect(coverage.bottomPainted, `${selector}: content covers the visible bottom`).toBe(true);
      if (selector !== '.hero-stage') {
        expect(coverage.bottom, `${selector}: covers the visible bottom`).toBeGreaterThanOrEqual(
          coverage.visibleBottom - 1
        );
      }
      await expect(page.locator('.footer-copyright')).not.toBeInViewport();
    }
  }

  for (const height of [740, 852, 790, 740, 852]) {
    await page.setViewportSize({ width: 393, height });
    await page.evaluate(async () => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    const bottom = await page.evaluate(() => {
      const container = document.querySelector('.footer-reveal')!.getBoundingClientRect();
      const footer = document.querySelector('.sticky-footer')!.getBoundingClientRect();
      const content = document.querySelector('#smooth-content')!.getBoundingClientRect();
      return {
        viewport: window.visualViewport!.height,
        container: container.bottom,
        footer: footer.bottom,
        content: content.bottom
      };
    });
    for (const edge of ['container', 'footer', 'content'] as const) {
      expect(
        Math.abs(bottom[edge] - bottom.viewport),
        `${edge}: no gap at ${height}px`
      ).toBeLessThan(2);
    }
    await expect(page.locator('.footer-copyright')).toBeInViewport();
  }
  await page.screenshot({ path: 'test-results/mobile-footer-browser-controls.png' });
  expect(errors).toEqual([]);
  await context.close();
});

test('mobile footer stays attached to the document on every fast-scroll frame', async ({
  browser
}) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    viewport: { width: 393, height: 740 },
    isMobile: true,
    hasTouch: true,
    userAgent: devices['Pixel 7'].userAgent
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await page.goto('/');
    await settle(page);
    await preserveMobileLayoutViewport(page);
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    for (const height of [740, 852, 790, 740, 852]) {
      await page.setViewportSize({ width: 393, height });
      const frames = await page.evaluate(async () => {
        const footer = document.querySelector<HTMLElement>('.sticky-footer')!;
        const container = footer.parentElement!;
        const content = document.querySelector('#smooth-content')!;
        const offsets = [550, 0, 180, 650, 25, 350, 0, 500, 80, 0, 400, 0];
        const samples: { gap: number; detached: number; extraContent: number }[] = [];
        const sample = () => {
          const surface = footer.getBoundingClientRect();
          const bounds = container.getBoundingClientRect();
          const viewport = window.visualViewport!;
          samples.push({
            gap: Math.max(
              0,
              Math.min(viewport.offsetTop + viewport.height, bounds.bottom) - surface.bottom
            ),
            detached: Math.abs(bounds.bottom - surface.bottom),
            extraContent: Math.abs(content.getBoundingClientRect().bottom - bounds.bottom)
          });
        };

        for (const offset of offsets) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              // Inspect before AND immediately after moving, without waiting
              // for JS scroll handlers to catch up. A translated footer used
              // to expose the page background for the next rendered frame.
              sample();
              window.scrollTo({
                top: document.documentElement.scrollHeight - innerHeight - offset,
                behavior: 'instant'
              });
              sample();
              resolve();
            });
          });
        }
        return samples;
      });

      expect(
        frames.length,
        'document boundary is checked throughout the fast-scroll sequence'
      ).toBeGreaterThanOrEqual(23);
      for (const [frame, sample] of frames.entries()) {
        expect(sample.gap, `${height}px, frame ${frame}: no exposed page background`).toBeLessThan(
          1
        );
        expect(
          sample.detached,
          `${height}px, frame ${frame}: footer surface stays in flow`
        ).toBeLessThan(1);
        expect(
          sample.extraContent,
          `${height}px, frame ${frame}: nothing follows the footer`
        ).toBeLessThan(1);
      }
      await expect(page.locator('.sticky-footer')).toHaveCSS('transform', 'none');
      await expect(page.locator('.footer-copyright')).toBeInViewport();
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('mobile flings do not paint an overscroll strip below the footer', async ({
  browser
}, testInfo) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    viewport: { width: 393, height: 740 }
  });
  const page = await context.newPage();

  try {
    await page.goto('/');
    await settle(page);
    await preserveMobileLayoutViewport(page);
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    for (const height of [740, 852, 740]) {
      await page.setViewportSize({ width: 393, height });
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight - innerHeight - 400)
        );
        await session.send('Input.synthesizeScrollGesture', {
          x: 196,
          y: Math.round(height * 0.7),
          yDistance: -1000,
          speed: 4500,
          preventFling: false,
          gestureSourceType: 'touch'
        });
        // Elastic overscroll is a compositor effect: DOM bounds stay correct
        // even when a strip is visibly painted. Inspect actual screenshot pixels
        // immediately after the fling, without waiting for the bounce to settle.
        const screenshot = await page.screenshot({
          path: testInfo.outputPath(`footer-fling-${height}-${attempt}.png`),
          scale: 'css'
        });
        const exposedPixels = await page.evaluate(async (base64) => {
          const image = new Image();
          image.src = `data:image/png;base64,${base64}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const drawing = canvas.getContext('2d')!;
          drawing.drawImage(image, 0, 0);
          const pixels = drawing.getImageData(8, image.height - 4, image.width - 16, 4).data;
          let exposed = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            if (
              Math.abs(pixels[index] - 183) > 3 ||
              Math.abs(pixels[index + 1] - 110) > 3 ||
              Math.abs(pixels[index + 2] - 121) > 3
            )
              exposed++;
          }
          return exposed;
        }, screenshot.toString('base64'));
        expect(
          exposedPixels,
          `${height}px, fling ${attempt}: footer color reaches the bottom`
        ).toBe(0);
      }
    }
    await expect(page.locator('html')).toHaveCSS('overscroll-behavior-y', 'none');
  } finally {
    await context.close();
  }
});

test('mobile hero and collection fill the viewport through pinning and viewport resize', async ({
  browser
}) => {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto('/');
  await settle(page);

  for (const [stage, progress] of [
    ['.hero-stage', 0.6],
    ['.collection-showcase', 0.5]
  ] as const) {
    await jumpPinned(page, stage, progress);
    for (const height of [852, 740, 852]) {
      await page.setViewportSize({ width: 393, height });
      await page.waitForTimeout(600);
      const coverage = await page.locator(stage).evaluate((element, selector) => {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const bounds = element.getBoundingClientRect();
        const painted = (y: number) =>
          Boolean(
            document
              .elementFromPoint(window.innerWidth / 2, y)
              ?.closest(selector === '.hero-stage' ? '.hero-stage,.page-foreground' : selector)
          );
        return {
          viewportHeight,
          top: bounds.top,
          height: bounds.height,
          topPainted: painted(1),
          bottomPainted: painted(viewportHeight - 2)
        };
      }, stage);
      expect(Math.abs(coverage.top)).toBeLessThan(2);
      expect(Math.abs(coverage.height - coverage.viewportHeight)).toBeLessThan(2);
      expect(coverage.topPainted, `${stage} ${height}px top`).toBe(true);
      expect(
        coverage.bottomPainted,
        `${stage} ${height}px bottom: ${JSON.stringify(coverage)}`
      ).toBe(true);
    }
  }
  await context.close();
});

test('mobile collection keeps the card stack and its text inside short viewports', async ({
  browser
}) => {
  test.setTimeout(60000);
  for (const { width, height } of [
    { width: 270, height: 573 },
    { width: 320, height: 640 },
    { width: 390, height: 740 },
    { width: 767, height: 900 }
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await page.goto('/');
    await settle(page);

    await page.locator('#collection').evaluate((section) => {
      window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top);
    });
    await page.waitForTimeout(1200);
    const headingSpacing = await page.locator('#collection').evaluate((section) => {
      const title = section.querySelector('.collection-heading h2')!.getBoundingClientRect();
      const firstCard = section.querySelector('.collection-card')!.getBoundingClientRect();
      return {
        above: title.top - section.getBoundingClientRect().top,
        below: firstCard.top - title.bottom
      };
    });
    expect(
      Math.abs(headingSpacing.above - headingSpacing.below),
      `${width}×${height}: equal space around collection title`
    ).toBeLessThan(3);

    await page.locator('.collection-showcase').evaluate((stage) => {
      window.scrollTo(0, window.scrollY + stage.getBoundingClientRect().top - 100);
    });
    await page.waitForTimeout(1200);
    const firstHeading = await page.locator('.collection-card h3').first().boundingBox();
    expect(
      firstHeading!.y + firstHeading!.height,
      `${width}×${height}: first card heading`
    ).toBeLessThan(height);

    for (const [index, progress] of [0, 1 / 3, 2 / 3].entries()) {
      await jumpPinned(page, '.collection-showcase', progress);
      const current = page.locator('.collection-card').nth(index);
      const card = await current.boundingBox();
      const heading = await current.locator('h3').boundingBox();
      const description = await current.locator('.collection-description').boundingBox();
      const image = await current.locator('.collection-image').boundingBox();
      const copy = await current.locator('.collection-copy').boundingBox();
      expect(
        Math.abs(heading!.width - copy!.width),
        `${width}×${height}: heading uses text column`
      ).toBeLessThan(1);
      expect(
        Math.abs(description!.width - copy!.width),
        `${width}×${height}: description uses text column`
      ).toBeLessThan(1);
      expect(
        Math.abs(copy!.width - image!.width),
        `${width}×${height}: text uses available card width`
      ).toBeLessThan(1);
      expect(card!.y, `${width}×${height}: card ${index + 1} top`).toBeGreaterThan(70);
      expect(
        card!.y + card!.height,
        `${width}×${height}: card ${index + 1} bottom`
      ).toBeLessThanOrEqual(height - 12);
      expect(card!.x, `${width}×${height}: card ${index + 1} left`).toBeGreaterThanOrEqual(20);
      expect(
        card!.x + card!.width,
        `${width}×${height}: card ${index + 1} right`
      ).toBeLessThanOrEqual(width - 20);
      expect(image!.height).toBeGreaterThan(120);
      expect(heading!.y + heading!.height).toBeLessThan(height);
      expect(description!.y + description!.height).toBeLessThan(height - 8);
      if (index > 0) {
        const previous = await page
          .locator('.collection-card')
          .nth(index - 1)
          .boundingBox();
        expect(card!.y - previous!.y, `${width}×${height}: visible stacked edge`).toBeGreaterThan(
          5
        );
      }
    }
    await page.screenshot({ path: `test-results/mobile-${width}-collection-text-width.png` });
    await context.close();
  }
});

test('reduced motion skips pinning and responds when the preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await settle(page);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.statement')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.collection-card').first()).toHaveCSS('position', 'static');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(300);
  await expect(page.locator('.pin-spacer')).toHaveCount(3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('#smooth-wrapper')).not.toHaveCSS('position', 'fixed');
  await expect(page.locator('#smooth-content')).toHaveCSS('transform', 'none');
  await expect(page.locator('.page-foreground')).toHaveCSS('margin-top', '0px');
  await expect(page.locator('.hero-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.collection-card').last()).toHaveCSS('transform', 'none');
  await expect(page.locator('.offer-panel').last()).toHaveCSS('transform', 'none');
  await expect(page.locator('.is-animated')).toHaveCount(0);
  const cards = await page.locator('.collection-card').evaluateAll((elements) =>
    elements.map((element) => ({
      top: element.getBoundingClientRect().top,
      bottom: element.getBoundingClientRect().bottom
    }))
  );
  expect(cards[1].top).toBeGreaterThan(cards[0].bottom);
});

test('countdown reaches the opening without negative values or continuing timers', async ({
  page
}) => {
  await page.clock.install({ time: new Date('2026-10-08T08:59:58+07:00') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.countdown-value').last()).toHaveText(/0[12]/);
  await page.clock.fastForward(3000);
  await expect(page.getByText('Grand Opening telah dimulai')).toBeVisible();
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Simpan tanggalnya' })).toHaveCount(0);
});

test('countdown motion pauses offscreen and cleans up for reduced motion', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  const section = page.locator('#opening');
  const orbit = page.locator('.countdown-orbit');
  await expect(section).not.toHaveClass(/is-countdown-visible/);
  await jump(page, '#opening');
  await expect(section).toHaveClass(/is-countdown-visible/);
  await expect(page.getByRole('timer')).toHaveAttribute('aria-live', 'off');
  await expect(page.locator('.countdown-dial')).toHaveCount(4);
  const movingTransform = await orbit.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(200);
  expect(await orbit.evaluate((el) => getComputedStyle(el).transform)).not.toBe(movingTransform);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(section).not.toHaveClass(/is-countdown-visible/);
  const pausedTransform = await orbit.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(200);
  expect(await orbit.evaluate((el) => getComputedStyle(el).transform)).toBe(pausedTransform);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await jump(page, '#opening');
  await expect(section).not.toHaveClass(/is-countdown-visible/);
  await expect(page.locator('.countdown-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.countdown-value').last()).toHaveCSS('animation-name', 'none');
  const reducedTransform = await orbit.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(200);
  expect(await orbit.evaluate((el) => getComputedStyle(el).transform)).toBe(reducedTransform);
});

test('countdown shows a stable opening message when visited after the deadline', async ({
  page
}) => {
  await page.clock.install({ time: new Date('2026-10-08T09:05:00+07:00') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.locator('.opened-message')).toHaveText('Grand Opening telah dimulai');
  await expect(page.locator('.countdown-date')).toContainText('Kamis, 8 Oktober 2026');
  await page.clock.fastForward(60000);
  await expect(page.locator('.countdown-value')).toHaveCount(0);
  await expect(page.locator('.opened-message')).toHaveText('Grand Opening telah dimulai');
});

test('prerendered cards and offers are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 }
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4187/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The New Chapter of the Brand' })).toBeVisible();
  await expect(page.locator('.collection-card')).toHaveCount(3);
  await expect(page.locator('.offer-panel')).toHaveCount(3);
  await expect(page.locator('#collection-03')).toHaveText('New Store\nNew Collection\nNew Story');
  await expect(page.locator('#collection-03')).toHaveCSS('white-space', 'pre-line');
  await expect(page.locator('#collection-03')).toBeVisible();
  await expect(page.getByText(/dapatkan voucher belanja Rp50.000/)).toBeVisible();
  await expect(page.locator('.countdown-title')).toHaveText('A new beginning.');
  await expect(page.locator('.countdown-date')).toContainText('Kamis, 8 Oktober 2026');
  await expect(page.locator('.countdown-value').first()).toHaveText('—');
  await expect(page.locator('[data-story-image]')).toHaveCSS('clip-path', 'none');
  await expect(page.locator('.story-lead')).toHaveCSS('opacity', '1');
  expect(await page.locator('.pin-spacer').count()).toBe(0);
  await context.close();
});

test('small phones and tablets do not overflow horizontally', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.body.scrollWidth), `${width}px viewport`).toBe(width);
    await expect(page.locator('.hero-title')).toBeVisible();
  }
});
