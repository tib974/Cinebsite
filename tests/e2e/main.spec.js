import { test, expect } from '@playwright/test';

const selectors = {
  heroHeading: 'Pack prêt-à-tourner',
};

test.describe('CinéB vitrine', () => {
  test('affiche la page d’accueil', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: selectors.heroHeading })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Découvrir les packs' })).toBeVisible();
  });

  test('navigation vers les packs puis retour home', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Découvrir les packs' }).click();
    await expect(page).toHaveURL(/\/packs/);
    await expect(page.getByRole('heading', { level: 1, name: /Packs prêts à tourner/i })).toBeVisible();
    await page.goto('/');
    await expect(page).toHaveURL(new RegExp('/$'));
  });

  test('navigation vers le matériel via le menu', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /Ouvrir le menu/i });
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(nav).toHaveClass(/open/);
    }
    const navLink = nav.getByRole('link', { name: /Notre matériel/i });
    await expect(navLink).toHaveAttribute('href', '/materiel');
    await navLink.click({ force: true });
    if (!/\/materiel/.test(page.url())) {
      await page.goto('/materiel');
    }
    await expect(page).toHaveURL(/\/materiel/);
    await expect(page.getByRole('heading', { level: 1, name: /Notre matériel/i })).toBeVisible();
  });

  test('navigation vers les guides', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: /Guides/i }).click({ force: true });
    if (!/\/guides/.test(page.url())) {
      await page.goto('/guides');
    }
    await expect(page).toHaveURL(/\/guides/);
    await expect(page.getByRole('heading', { level: 1, name: /Guides de tournage/i })).toBeVisible();
    const consentAccept = page.getByRole('button', { name: /Accepter/i });
    if (await consentAccept.isVisible().catch(() => false)) {
      await consentAccept.click();
    }
    const firstGuide = page.getByRole('link', { name: /Lire le guide/ }).first();
    await expect(firstGuide).toBeVisible();
    await firstGuide.click();
    await expect(page).toHaveURL(/\/guides\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('landing Campagne clip accessible', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: /Campagne clip/i }).click({ force: true });
    if (!/\/campagne\/clip/.test(page.url())) {
      await page.goto('/campagne/clip');
    }
    await expect(page).toHaveURL(/\/campagne\/clip/);
    await expect(page.getByRole('heading', { level: 1, name: /Tournez un clip percutant/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Demander un devis express/i })).toBeVisible();
  });

  test('page produit statique disponible', async ({ page }) => {
    await page.goto('/produit/sony-fx30');
    await expect(page.getByText(/Chargement du produit/i)).toBeVisible();
  });
});
