import { continueLegacyRun } from './legacySave';
import { test, expect } from '@playwright/test';

test.describe('F9 – Teljes End-to-End tesztek', () => {
  test('F9.1 – Régi mentés betöltése és első döntés', async ({ page }) => {
    await continueLegacyRun(page, 'vass_dora', 'e2e-start');
    await expect(page.getByRole('heading', { name: 'Leszállás az Ébenholdon' })).toBeVisible();
    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await expect(page.getByRole('heading', { name: 'Főzsilip' })).toBeVisible();
    await page.getByRole('button', { name: 'Térkép', exact: true }).click();
    await expect(page.getByText(/Régi mentésből folytatod/)).toBeVisible();
    const route = page.getByRole('list', { name: /Útvonal/ });
    await expect(route.getByRole('listitem')).toHaveText([
      'FőzsilipItt tartasz',
      'Leszállás az Ébenholdon',
    ]);
  });

  test('F9.2 – Seedelt teljes végigjátszás: E1 (Néma menekülés)', async ({ page }) => {
    await continueLegacyRun(page, 'vass_dora', 'e2e-e1');
    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await page.getByRole('button', { name: /lakókörlet felé/i }).click();
    await page.getByRole('button', { name: /Parancsnoki kártyát/i }).click();
    await page.getByRole('button', { name: /adótoronyba/i }).click();
    await page.getByRole('button', { name: /Dekódolod/i }).click();
    await page.getByRole('button', { name: /Szembesíted MÁRÁ-t/i }).click();
    await page.getByRole('button', { name: /Kártya: Rövidzár/i }).click();
    // Csendes távozás (nem robbantja fel az állomást -> E1)
    await page.getByRole('button', { name: /csendben elindulsz kifelé/i }).click();
    await page.getByRole('button', { name: /záródó rámpának/i }).click();

    await expect(page.getByRole('heading', { name: 'Néma menekülés' })).toBeVisible();
  });

  test('F9.3 – Mentés, oldal újratöltése, betöltés és folytatás', async ({ page }) => {
    await continueLegacyRun(page, 'imre_lili', 'e2e-save-reload');
    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await page.getByRole('button', { name: /lakókörlet felé/i }).click();
    await expect(page.getByRole('heading', { name: 'Lakókörlet' })).toBeVisible();

    await page.getByRole('button', { name: /Mentés \/ Betöltés/i }).click();
    await page.getByRole('button', { name: /Mentés: 1\. mentés/i }).click();
    await expect(page.getByText(/Mentve: 1\. mentés/i)).toBeVisible();

    // Oldal teljes újratöltése
    await page.reload();
    await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
    await page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Csendes Jel', exact: true }) })
      .getByRole('button', { name: 'Kaland megnyitása' })
      .click();
    await expect(page.getByRole('heading', { name: 'Csendes Jel' })).toBeVisible();

    await page.getByRole('button', { name: 'Betöltés' }).click();
    await page.getByRole('button', { name: /Betöltés: 1\. mentés/i }).click();
    await expect(page.getByRole('heading', { name: 'Lakókörlet' })).toBeVisible();
    await page.getByRole('button', { name: 'Térkép', exact: true }).click();
    await expect(page.getByRole('list', { name: /Útvonal/ }).getByRole('listitem')).toHaveCount(3);
    await page.getByRole('button', { name: 'Vissza', exact: true }).click();

    // Folytatás
    await page.getByRole('button', { name: /Parancsnoki kártyát/i }).click();
    await expect(page.getByRole('heading', { name: 'Központi folyosó' })).toBeVisible();
  });

  test('F9.4 – Több mentési slot függetlensége', async ({ page }) => {
    await continueLegacyRun(page, 'vass_dora', 'e2e-slots');
    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await expect(page.getByRole('heading', { name: 'Főzsilip' })).toBeVisible();

    // Slot 1: Főzsilip
    await page.getByRole('button', { name: /Mentés \/ Betöltés/i }).click();
    await page.getByRole('button', { name: /Mentés: 1\. mentés/i }).click();
    await page.getByRole('button', { name: 'Bezárás' }).click();

    // Továbblépés -> Labor, mentés Slot 2-be
    await page.getByRole('button', { name: /laboratórium felé/i }).click();
    await expect(page.getByRole('heading', { name: 'Laboratórium' })).toBeVisible();

    await page.getByRole('button', { name: /Mentés \/ Betöltés/i }).click();
    await page.getByRole('button', { name: /Mentés: 2\. mentés/i }).click();

    // Visszatöltés Slot 1-ből -> Főzsilip
    await page.getByRole('button', { name: /Betöltés: 1\. mentés/i }).click();
    await expect(page.getByRole('heading', { name: 'Főzsilip' })).toBeVisible();

    // Visszatöltés Slot 2-ből -> Laboratórium
    await page.getByRole('button', { name: /Mentés \/ Betöltés/i }).click();
    await page.getByRole('button', { name: /Betöltés: 2\. mentés/i }).click();
    await expect(page.getByRole('heading', { name: 'Laboratórium' })).toBeVisible();
  });

  test('F9.5 – Kockadobás megjelenítése és eredmény-visszajelzés', async ({ page }) => {
    await continueLegacyRun(page, 'ko_bence', 'e2e-dice');
    await page.getByRole('button', { name: /szervizaknába/i }).click();
    await expect(page.getByRole('heading', { name: 'Szervizakna' })).toBeVisible();

    await page.getByRole('button', { name: /Hőpatront/i }).click();
    const banner = page.getByRole('status');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Kitartás-próba/i);
    await expect(banner).toContainText(/Dobás:/i);
    await expect(banner).toContainText(/(Siker|Kudarc)/i);
  });

  test('F9.6 – Tárgy megszerzése új választást nyit meg (Parancsnoki kártya -> Reaktor túlterhelés)', async ({
    page,
  }) => {
    await continueLegacyRun(page, 'vass_dora', 'e2e-item-unlock');
    await page.getByRole('button', { name: /főbejáraton/i }).click();
    await page.getByRole('button', { name: /lakókörlet felé/i }).click();
    await page.getByRole('button', { name: /Parancsnoki kártyát/i }).click();

    // A tárgylistában megjelenik a Parancsnoki kártya
    await page.getByRole('button', { name: 'Napló megnyitása' }).click();
    await expect(page.getByText('Parancsnoki kártya', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Vissza', exact: true }).click();

    await page.getByRole('button', { name: /adótoronyba/i }).click();
    await page.getByRole('button', { name: /Dekódolod/i }).click();
    await page.getByRole('button', { name: /Szembesíted MÁRÁ-t/i }).click();
    await page.getByRole('button', { name: /Kártya: Rövidzár/i }).click();

    // Az N12-ben a Parancsnoki kártya miatt látható a reaktor túlterhelése választás
    await expect(page.getByRole('heading', { name: 'Az állomás szíve' })).toBeVisible();
    await expect(page.getByRole('button', { name: /reaktor túlterhelését/i })).toBeVisible();
  });
});

test('a felfedezési sáv és a térkép mentés után is a bejárt jeleneteket mutatja mobilon', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 630 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Új kaland', exact: true }).click();
  await page
    .getByRole('article')
    .filter({ hasText: 'A ködlámpás őre' })
    .getByRole('button', { name: 'Kaland megnyitása' })
    .click();
  await page.getByRole('button', { name: 'Saját karakter létrehozása' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Alma');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();

  const progress = page.getByRole('progressbar', { name: /Felfedezett jelenetek/ });
  await expect(progress).toHaveAttribute('value', '1');
  const climb = page.getByRole('button', { name: /Felfutsz a toronyba/ });
  await climb.scrollIntoViewIfNeeded();
  await expect(progress).toBeInViewport();
  await climb.click();
  await expect(progress).toHaveAttribute('value', '2');
  await page.getByRole('button', { name: 'Térkép', exact: true }).click();
  const route = page.getByRole('list', { name: /Útvonal/ });
  await expect(route.getByRole('listitem')).toHaveCount(2);
  await expect(route.locator('[aria-current="step"]')).toContainText('A hideg lámpa');
  await expect(route.getByText('A part', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

  await page.reload();
  await page.getByRole('button', { name: 'Folytatás', exact: true }).click();
  await expect(progress).toHaveAttribute('value', '2');
  await page.getByRole('button', { name: /A toronyharanggal jelzel/ }).click();
  await expect(progress).toHaveAttribute('value', '2');
  await page.getByRole('button', { name: 'Térkép', exact: true }).click();
  await expect(page.getByText('Befejezés elérve', { exact: true })).toBeVisible();
  await expect(route.getByRole('listitem')).toHaveCount(3);
  await expect(route.locator('[aria-current="step"]')).toContainText('Partot értek');
});
