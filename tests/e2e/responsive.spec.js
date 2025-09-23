import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { label: 'mobile-390', size: { width: 390, height: 844 } },
  { label: 'desktop-1440', size: { width: 1440, height: 900 } },
];

const PAGES = [
  { url: '/', heading: /Pack prêt-à-tourner/i },
  { url: '/packs', heading: /Packs prêts à tourner/i },
  { url: '/materiel', heading: /Notre matériel/i },
  { url: '/guides', heading: /Guides de tournage/i },
  { url: '/campagne/clip', heading: /Tournez un clip percutant/i },
  { url: '/contact', heading: /Contact/i },
];

test.describe('Responsive layout safeguards', () => {
  for (const viewport of BREAKPOINTS) {
    for (const pageConfig of PAGES) {
      test(`${pageConfig.url} — pas de débordement horizontal en ${viewport.label}`, async ({ page }) => {
        await page.setViewportSize(viewport.size);
        await page.goto(pageConfig.url);
        const headingLocator = page.getByRole('heading', { name: pageConfig.heading });
        await expect(headingLocator).toBeVisible();

        const hasOverflow = await page.evaluate(() => {
          const { scrollWidth, clientWidth } = document.documentElement;
          return scrollWidth > clientWidth + 1;
        });
        expect(hasOverflow, 'Le layout dépasse la largeur du viewport').toBeFalsy();

        if (pageConfig.url === '/' && viewport.label === 'mobile-390') {
          await expect(page.getByRole('button', { name: /Ouvrir le menu/i })).toBeVisible();
          const ctaWrap = await page.locator('.hero-slide.active .hero-slide__ctas').first().evaluate((el) => getComputedStyle(el).flexWrap);
          expect(ctaWrap, 'Les CTA du hero doivent pouvoir passer à la ligne').toBe('wrap');
        }

        if (pageConfig.url === '/' && viewport.label === 'desktop-1440') {
          await expect(page.getByRole('button', { name: /Ouvrir le menu/i })).not.toBeVisible();
          await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
        }

        if (pageConfig.url === '/packs' && viewport.label === 'mobile-390') {
          const toolbarOverflow = await page.locator('.packs-toolbar').evaluate((el) => el.scrollWidth - el.clientWidth);
          expect(toolbarOverflow, 'La toolbar packs doit rester fluide en mobile').toBeLessThanOrEqual(1);
        }

        if (pageConfig.url === '/contact') {
          const gridTemplate = await page.locator('.contact-form__layout').evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim());
          if (viewport.label === 'mobile-390') {
            expect(gridTemplate === 'none' || !gridTemplate.includes(' ')).toBeTruthy();
          } else {
            expect(gridTemplate.includes(' ')).toBeTruthy();
          }
        }
      });
    }
  }
});
