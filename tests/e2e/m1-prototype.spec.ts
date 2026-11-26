import { continueLegacyRun } from './legacySave';
import { test, expect } from '@playwright/test';

test.describe('F6.4 – M1 ötperces prototípus (≥ 2 eltérő befejezés)', () => {
  test('végigjátszás az E2 (Tűz a jégen) befejezésig', async ({ page }) => {
    await continueLegacyRun(page, 'vass_dora', 'm1-e2');

    await expect(page.getByRole('heading', { name: 'Leszállás az Ébenholdon' })).toBeVisible();
    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await page.getByRole('button', { name: /lakókörlet felé/i }).click();
    await page.getByRole('button', { name: /Parancsnoki kártyát/i }).click();
    await page.getByRole('button', { name: /adótoronyba/i }).click();
    await page.getByRole('button', { name: /Dekódolod/i }).click();
    await page.getByRole('button', { name: /Szembesíted MÁRÁ-t/i }).click();
    // Dóra Rövidzár kártyájával garantált siker a szerverteremben
    await page.getByRole('button', { name: /Kártya: Rövidzár/i }).click();
    await page.getByRole('button', { name: /reaktor túlterhelését/i }).click();
    await page.getByRole('button', { name: /záródó rámpának/i }).click();

    await expect(page.getByRole('heading', { name: 'Tűz a jégen' })).toBeVisible();
  });

  test('végigjátszás az E3 (Szállítmány) befejezésig', async ({ page }) => {
    await continueLegacyRun(page, 'vass_dora', 'm1-e3');

    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await page.getByRole('button', { name: /lakókörlet felé/i }).click();
    await page.getByRole('button', { name: /Parancsnoki kártyát/i }).click();
    await page.getByRole('button', { name: /adótoronyba/i }).click();
    await page.getByRole('button', { name: /Dekódolod/i }).click();
    await page.getByRole('button', { name: /Meghallgatod az ajánlatot/i }).click();
    await page.getByRole('button', { name: /Felkapod a mintatartályt/i }).click();

    await expect(page.getByRole('heading', { name: 'Szállítmány' })).toBeVisible();
  });
});
