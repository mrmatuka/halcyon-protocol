import { test, expect } from '@playwright/test';

test('mobilon elérhető a mentés, a karakter kalandonként vagy alapértelmezettként rendelhető hozzá', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 630 });
  await page.goto('/');
  const openAdventure = async (title: string) => {
    await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
    await page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      .getByRole('button', { name: 'Kaland megnyitása' })
      .click();
  };
  await openAdventure('Csendes Jel');
  const create = page.getByRole('button', { name: 'Saját karakter létrehozása' });
  await create.click();

  const save = page.getByRole('button', { name: 'Karakter mentése' });
  const all = page.getByRole('checkbox', { name: 'Összes kaland', exact: true });
  const signal = page.getByRole('checkbox', { name: 'Csendes Jel', exact: true });
  const lantern = page.getByRole('checkbox', { name: 'A ködlámpás őre', exact: true });
  await expect(save).toBeInViewport({ ratio: 1 });
  await expect(all).toBeChecked();
  await expect(signal).toHaveCount(0);
  await page.getByLabel('Név', { exact: true }).fill('Dóra');
  await all.uncheck();
  await expect(signal).toBeChecked();
  await signal.uncheck();
  await lantern.check();
  await page.getByRole('button', { name: 'Kasztportré cseréje' }).scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport({ ratio: 1 });
  await save.click();
  await expect(create).toBeVisible();

  await page.reload();
  await openAdventure('A ködlámpás őre');
  const newGame = page.getByRole('button', { name: 'Új játék', exact: true });
  await newGame.click();
  await expect(page.getByText('Dóra', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Napló', exact: true }).click();
  await page.getByRole('button', { name: 'Szerkesztés', exact: true }).click();
  await expect(all).not.toBeChecked();
  await expect(lantern).toBeChecked();
  await expect(signal).not.toBeChecked();
  await all.check();
  await save.click();

  await openAdventure('Csendes Jel');
  await newGame.click();
  await expect(page.getByText('Dóra', { exact: true })).toBeVisible();
});

test('a karaktergenerátor megtartja a kiosztott pontokat és visszatér a kalandhoz', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await page
    .getByRole('article')
    .filter({ hasText: 'Csendes Jel' })
    .getByRole('button', { name: 'Kaland megnyitása' })
    .click();

  const create = page.getByRole('button', { name: 'Saját karakter létrehozása' });
  await create.click();
  await page.getByLabel('Név', { exact: true }).fill('Elvetett karakter');
  await page.getByRole('button', { name: 'Mégse', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Csendes Jel', exact: true })).toBeVisible();

  await create.click();
  const name = page.getByLabel('Név', { exact: true });
  await expect(name).toHaveValue('');
  await name.fill('Eszter');
  const knowledge = page.getByRole('spinbutton', { name: /^Tudás/ });
  const resolve = page.getByRole('spinbutton', { name: /^Elszántság/ });
  await knowledge.fill('3');
  await resolve.fill('1');
  await page.getByRole('combobox', { name: 'Egyéni adottság', exact: true }).selectOption('curious');
  await expect(knowledge).toHaveValue('3');
  await expect(resolve).toHaveValue('1');
  await page.getByRole('combobox', { name: 'Kaszt', exact: true }).selectOption('scholar');
  await expect(knowledge).toHaveValue('1');
  await expect(resolve).toHaveValue('1');
  await expect(page.getByText('Elosztható pontok: 2')).toBeVisible();
  await resolve.fill('3');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();

  await page.getByRole('button', { name: 'Új játék', exact: true }).click();
  await expect(page.getByText('Eszter', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: 'Napló megnyitása' }).click();
  await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Eszter');
});

test('saját hős, angol nyelvváltás, nehézség és független automentések', async ({ page }) => {
  await page.goto('/');
  const card = (title: string) =>
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await page.getByRole('button', { name: 'Napló', exact: true }).click();
  await page.getByRole('button', { name: 'Új karakter' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Alma');
  await page.getByRole('combobox', { name: 'Kaszt', exact: true }).selectOption('scholar');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await card('Csendes Jel').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: /főbejáraton/i }).click();
  await expect(page.getByRole('heading', { name: 'Főzsilip', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await card('A ködlámpás őre').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByLabel('Játékmód').selectOption('2');
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: 'Napló megnyitása' }).click();
  await expect(page.getByTestId('stat-figyelem')).toContainText('8');
  await page.getByRole('button', { name: 'Vissza', exact: true }).click();
  await page.getByRole('button', { name: 'Beállítások', exact: true }).click();
  await page.getByLabel('Nyelv').selectOption('en');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The shore' })).toBeVisible();
  await page.getByRole('button', { name: 'Open journal' }).click();
  await expect(page.getByText('Alma', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: /source of the ringing/ }).click();
  await expect(page.getByRole('status')).toContainText(/8 \+ 2/);

  await page.reload();
  await page.getByRole('button', { name: 'Book Adventures', exact: true }).click();
  await card('Silent Signal').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Main Airlock' })).toBeVisible();
  await page.getByRole('button', { name: 'Book Adventures', exact: true }).click();
  await card('The Lantern Keeper').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open journal' }).click();
  await expect(page.getByText('Alma', { exact: true })).toBeVisible();
});

test('a vizuális szerkesztő és a ZIP ugyanazt a hordozható formátumot használja', async ({
  browser,
  page,
  baseURL,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Beállítások', exact: true }).click();
  await page.getByRole('button', { name: 'Történetszerkesztő', exact: true }).click();
  await page.getByRole('button', { name: 'Új kaland szerkesztése' }).click();
  await page.getByLabel('Kalandazonosító').fill('kapu-teszt');
  await page.getByLabel('Cím (HU)').fill('A titkos kapu');
  await page.getByLabel('Jelenetcím').fill('A kapunál');
  await page.getByLabel('Történetszöveg').fill('A kapu egyetlen érintésre kinyílik.');
  await page.getByLabel('Jelenetképfájl').setInputFiles('public/icons/icon-192.png');
  await expect(page.getByLabel('Kép leírása')).toHaveValue('A kapunál');
  await page.getByRole('button', { name: 'Ellenőrzés' }).click();
  await expect(page.getByRole('status')).toContainText('érvényes');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ZIP letöltése' }).click();
  const zipPath = await (await downloadPromise).path();
  expect(zipPath).toBeTruthy();
  await page.getByRole('button', { name: 'Mentés a könyvtárba' }).click();
  await expect(page.getByRole('heading', { name: 'A titkos kapu' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A titkos kapu' })).toBeVisible();

  const other = await browser.newContext({ baseURL });
  try {
    const imported = await other.newPage();
    await imported.goto('/');
    await imported.getByRole('button', { name: 'Beállítások', exact: true }).click();
    await imported.getByRole('button', { name: 'Történetszerkesztő', exact: true }).click();
    await imported.getByLabel('ZIP importálása').setInputFiles(zipPath!);
    await expect(imported.getByText('A kaland bekerült a helyi könyvtárba.')).toBeVisible();
    await imported.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
    const card = imported
      .locator('article')
      .filter({ has: imported.getByRole('heading', { name: 'A titkos kapu' }) });
    await card.getByRole('button', { name: 'Kaland megnyitása' }).click();
    await expect(imported.getByRole('button', { name: 'Új játék' })).toHaveCount(0);
    await imported.getByRole('button', { name: 'Saját karakter létrehozása' }).click();
    await imported.getByLabel('Név', { exact: true }).fill('Judit');
    await imported.getByRole('button', { name: 'Karakter mentése' }).click();
    await imported.getByRole('button', { name: 'Új játék' }).click();
    await imported.getByRole('button', { name: 'Kaland indítása' }).click();
    await expect(imported.getByRole('heading', { name: 'A kapunál' })).toBeVisible();
    await expect(imported.locator('img[alt="A kapunál"]')).toBeVisible();
    await imported.getByRole('button', { name: 'Tovább' }).click();
    await expect(imported.getByRole('heading', { name: 'Befejezés', exact: true })).toBeVisible();
  } finally {
    await other.close();
  }
});

test('egy közös karakter mindkét kalandot indítja, a hozzárendelés felülírja és a mentés megtartja a hőst', async ({
  page,
}) => {
  await page.goto('/');
  const card = (title: string) =>
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await page.getByRole('button', { name: 'Napló', exact: true }).click();
  await page.getByRole('button', { name: 'Új karakter' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Nara');
  await page.getByLabel('Saját portré feltöltése').setInputFiles('public/icons/icon-192.png');
  await expect(page.locator('form img')).toHaveAttribute('src', /^data:image\/jpeg/);
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await expect(page.getByRole('heading', { name: 'Nara' })).toBeVisible();

  for (const title of ['Csendes Jel', 'A ködlámpás őre']) {
    await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
    await card(title).getByRole('button', { name: 'Kaland megnyitása' }).click();
    await page.getByRole('button', { name: 'Új játék' }).click();
    await expect(page.getByText('Nara', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kész hősök' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Kaland indítása' }).click();
    await page.getByRole('button', { name: 'Napló megnyitása' }).click();
    await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Nara');
  }
  await page.getByRole('button', { name: 'Főmenü', exact: true }).click();
  await page.getByRole('button', { name: 'Napló', exact: true }).click();
  await page.getByRole('button', { name: 'Új karakter' }).click();
  await page.getByRole('button', { name: 'Véletlen karakter' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Orin');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByLabel('Csendes Jel', { exact: false }).selectOption({ label: 'Orin' });
  await page.reload();
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await card('Csendes Jel').getByRole('button', { name: 'Folytatás' }).click();
  await page.getByRole('button', { name: 'Napló megnyitása' }).click();
  await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Nara');
  await page.getByRole('button', { name: 'Vissza', exact: true }).click();
  await page.getByRole('button', { name: 'Vissza', exact: true }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await expect(page.getByText('Orin', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: 'Napló megnyitása' }).click();
  await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Orin');
});

test('üres kezdőállapot, elkülönülő böngészőprofilok és menthető személyes állapot', async ({
  browser,
  page,
  baseURL,
}) => {
  await page.goto('/');
  const card = (title: string) =>
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  for (const title of ['Csendes Jel', 'A ködlámpás őre']) {
    await card(title).getByRole('button', { name: 'Kaland megnyitása' }).click();
    await expect(page.getByRole('button', { name: 'Saját karakter létrehozása' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Új játék', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  }
  await card('Csendes Jel').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Saját karakter létrehozása' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Csak az enyém');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Új játék', exact: true }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: 'Beállítások', exact: true }).click();
  await page.getByLabel('Nyelv').selectOption('en');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Book Adventures', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Book Adventures' })).toBeVisible();
  await card('Silent Signal').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open journal' }).click();
  await expect(page.getByRole('region', { name: 'Character sheet' })).toContainText(
    'Csak az enyém',
  );

  const another = await browser.newContext({ baseURL });
  try {
    const newcomer = await another.newPage();
    await newcomer.goto('/');
    await expect(newcomer.getByRole('button', { name: 'Folytatás', exact: true })).toBeDisabled();
    await newcomer.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
    await expect(newcomer.getByRole('heading', { name: 'Könyvkaland' })).toBeVisible();
    await expect(newcomer.getByRole('heading', { name: 'Csendes Jel' })).toBeVisible();
    await expect(newcomer.getByRole('button', { name: 'Folytatás', exact: true })).toHaveCount(0);
    await newcomer.getByRole('button', { name: 'Napló', exact: true }).click();
    await expect(newcomer.getByRole('heading', { name: 'Csak az enyém' })).toHaveCount(0);
  } finally {
    await another.close();
  }
});

test('letiltott localStorage mellett a profil és a mentés átmenetileg működik', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked by browser policy', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('átmeneti adatok');
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  const book = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Csendes Jel', exact: true }) });
  await book.getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Saját karakter létrehozása' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Átmeneti');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Új játék', exact: true }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await book.getByRole('button', { name: 'Folytatás', exact: true }).click();
  await page.getByRole('button', { name: 'Napló megnyitása' }).click();
  await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Átmeneti');
  await page.reload();
  await page.getByRole('button', { name: 'Könyvkaland', exact: true }).click();
  await book.getByRole('button', { name: 'Kaland megnyitása' }).click();
  await expect(page.getByRole('button', { name: 'Saját karakter létrehozása' })).toBeVisible();
});

test('a mobil polc és olvasó elfér, a karakterlap nyitható, és az arculat nyelvet vált', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  const brand = page.getByRole('button', { name: 'Kalandpolc', exact: true });
  await expect(brand).toBeVisible();
  await expect(brand.locator('svg')).toBeVisible();
  await expect(page).toHaveTitle('Kalandpolc');

  const navigation = page.getByRole('navigation', { name: 'Fő navigáció' });
  const bottom = await navigation.boundingBox();
  expect(bottom && Math.round(bottom.y + bottom.height)).toBe(720);
  await page.getByRole('button', { name: 'Új kaland' }).click();
  const shelf = page.getByRole('main');
  const books = shelf.getByRole('article');
  await expect(books).toHaveCount(2);
  const positions = await books.evaluateAll((cards) =>
    cards.map((card) => card.getBoundingClientRect().top),
  );
  expect(positions[0]).toBe(positions[1]);
  expect(await shelf.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

  await page.getByRole('button', { name: 'Sci-fi horror', exact: true }).click();
  await expect(books).toHaveCount(1);
  await page.getByRole('button', { name: 'Mind', exact: true }).click();
  await page.getByRole('button', { name: 'Keresés', exact: true }).click();
  const search = page.getByRole('searchbox');
  await search.fill('ködlámpás');
  await expect(books).toHaveCount(1);
  await expect(books.first()).toContainText('A ködlámpás őre');
  await page.getByRole('button', { name: 'Keresés', exact: true }).click();
  await expect(books).toHaveCount(2);

  const manifest = page.locator('link[rel="manifest"]');
  const huManifestPath = (await manifest.getAttribute('href'))!;
  const enManifestPath = huManifestPath.replace(/manifest\.webmanifest$/, 'manifest.en.webmanifest');
  await page.getByRole('button', { name: 'Beállítások', exact: true }).click();
  await page.getByLabel('Nyelv').selectOption('en');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Adventure Shelf', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Adventure Shelf');
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute(
    'content',
    'Adventure Shelf',
  );

  await expect(manifest).toHaveAttribute('href', enManifestPath);
  const hu = await (await request.get(huManifestPath)).json();
  const en = await (await request.get(enManifestPath)).json();
  expect(en).toMatchObject({ id: hu.id, start_url: hu.start_url, scope: hu.scope, lang: 'en' });
  expect(en.name).toBe('Adventure Shelf');

  await books
    .filter({ hasText: 'Silent Signal' })
    .getByRole('button', { name: 'Open adventure' })
    .click();
  await page.getByRole('button', { name: 'Create your character' }).click();
  await expect(page.getByRole('checkbox', { name: 'All stories', exact: true })).toBeChecked();
  await page.getByLabel('Name', { exact: true }).fill('Alma');
  await page.getByRole('button', { name: 'Save character' }).click();
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start adventure' }).click();

  await page.getByRole('button', { name: 'Open journal' }).press('Enter');
  const journal = page.getByRole('main', { name: 'Journal' });
  await expect(journal.getByRole('region', { name: 'Character sheet' })).toContainText('Alma');
  await journal.getByRole('button', { name: 'Equipment', exact: true }).click();
  await expect(journal.getByRole('region', { name: 'Inventory' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(journal).toHaveCount(0);

  const reader = page.getByRole('main');
  await expect(reader.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(reader.getByTestId('scene-illustration').locator('img')).toBeVisible();
  await expect(reader.getByRole('region', { name: 'Choices' })).toBeVisible();
  expect(await reader.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(reader.getByRole('region', { name: 'Choices' })).toBeVisible();
});
