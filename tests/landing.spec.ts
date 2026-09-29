import { expect, test, type Page } from '@playwright/test';

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
  await jumpPinned(page, '.collection-showcase', 0.25);
  const active = await page.locator('.collection-card').nth(1).boundingBox();
  expect(active!.y).toBeGreaterThan(90);
  expect(active!.y).toBeLessThan(130);
  const previousScale = await page
    .locator('.collection-card')
    .first()
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
  expect(previousScale).toBeCloseTo(0.95, 2);
  const gallery = page.getByRole('region', { name: 'Empat koleksi Uzma Fashion' });
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
  await expect(page.locator('.collection-card')).toHaveCount(4);
  await expect(page.locator('.offer-panel')).toHaveCount(3);

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
  await expect(page.getByText(/Nikmati diskon 10%/)).toBeVisible();
  await expect(page.getByText(/Dapatkan voucher belanja Rp50.000/)).toBeVisible();
  await jump(page, '#opening');
  await expect(page.getByRole('heading', { name: 'Countdown' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Simpan tanggalnya' })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1400);
  await expect(page.locator('.footer-coming')).toBeInViewport();
  await expect(page.getByText('© 2026 Uzma Fashion', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/desktop-footer.png' });
  expect(errors).toEqual([]);
  expect(missingResources).toEqual([]);
});

test('smooth scrolling holds the expanded hero while Welcome covers it', async ({ page }) => {
  await page.goto('/');
  await settle(page);
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
      const initial = await page.locator('.hero-visual').boundingBox();
      expect(initial!.width).toBeCloseTo(size.width * 0.74, 0);
      expect(initial!.height).toBeCloseTo(size.height * 0.64, 0);
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
      expect(await page.evaluate(() => document.body.scrollWidth)).toBe(size.width);

      // Browser toolbar changes are smaller than an orientation change.
      const shorter = size.height - 70;
      await page.setViewportSize({ width: size.width, height: shorter });
      await page.waitForTimeout(500);
      await jumpPinned(page, '.hero-stage', 1.15 / 2.15);
      expect((await page.locator('.hero-visual').boundingBox())!.height).toBeCloseTo(shorter, 0);
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
  expect(Math.abs((await page.locator('#about').boundingBox())!.y)).toBeLessThan(2);
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
  await page.screenshot({ path: 'test-results/mobile-opening.png' });
  await expect(page.getByRole('heading', { name: 'Countdown' })).toBeVisible();
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
      await expect(page.locator('.footer-coming')).not.toBeInViewport();
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollBy(0, 16));
      await page.waitForTimeout(250);
      await expect(page.locator('.footer-copyright')).not.toBeInViewport();
      await expect(page.locator('.footer-coming')).not.toBeInViewport();
    }
  }

  // The reveal still works at the actual bottom of the page, then disappears
  // again when returning to the hero (including with reduced motion).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('.footer-copyright')).toBeInViewport();
  await expect(page.locator('.footer-coming')).toBeInViewport();
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
    { width: 390, height: 740 }
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

    for (const [index, progress] of [0, 0.25, 0.5, 0.75].entries()) {
      await jumpPinned(page, '.collection-showcase', progress);
      const current = page.locator('.collection-card').nth(index);
      const card = await current.boundingBox();
      const heading = await current.locator('h3').boundingBox();
      const description = await current.locator('.collection-description').boundingBox();
      const image = await current.locator('.collection-image').boundingBox();
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
      if (width === 270 && index === 3) {
        expect(heading!.height, 'Quiet Radiance wraps to two lines').toBeGreaterThan(45);
      }
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
  await page.clock.install({ time: new Date('2026-10-25T09:59:58+07:00') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.countdown-value').last()).toHaveText(/0[12]/);
  await page.clock.fastForward(3000);
  await expect(page.getByText('Grand Opening telah dimulai')).toBeVisible();
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Simpan tanggalnya' })).toHaveCount(0);
});

test('prerendered cards and offers are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 }
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4187/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The New Collection' })).toBeVisible();
  await expect(page.locator('.collection-card')).toHaveCount(4);
  await expect(page.locator('.offer-panel')).toHaveCount(3);
  await expect(page.getByText('Quiet Radiance', { exact: true })).toBeVisible();
  await expect(page.getByText(/Dapatkan voucher belanja Rp50.000/)).toBeVisible();
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
