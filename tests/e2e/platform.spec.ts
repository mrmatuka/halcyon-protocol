import { test, expect } from '@playwright/test';

test('saját hős, angol nyelvváltás, nehézség és független automentések', async ({ page }) => {
  await page.goto('/');
  const card = (title: string) =>
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await page.getByRole('button', { name: 'Karakterek', exact: true }).click();
  await page.getByRole('button', { name: 'Új karakter' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Alma');
  await page.getByRole('combobox', { name: 'Kaszt', exact: true }).selectOption('scholar');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Könyvespolc', exact: true }).click();
  await card('Csendes Jel').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: /főbejáraton/i }).click();
  await expect(page.getByRole('heading', { name: 'Főzsilip', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Kalandkönyvtár' }).click();
  await card('A ködlámpás őre').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByLabel('Játékmód').selectOption('2');
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await expect(page.getByTestId('stat-figyelem')).toContainText('8');
  await page.getByLabel('Nyelv').selectOption('en');
  await expect(page.getByRole('heading', { name: 'The shore' })).toBeVisible();
  await expect(page.getByText('Alma', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /source of the ringing/ }).click();
  await expect(page.getByRole('status')).toContainText(/8 \+ 2/);

  await page.reload();
  await card('Silent Signal').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Main Airlock' })).toBeVisible();
  await page.getByRole('button', { name: 'Adventure Library' }).click();
  await card('The Lantern Keeper').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Alma', { exact: true })).toBeVisible();
});

test('a vizuális szerkesztő és a ZIP ugyanazt a hordozható formátumot használja', async ({
  browser,
  page,
  baseURL,
}) => {
  await page.goto('/');
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
  await expect(page.getByRole('heading', { name: 'A titkos kapu' })).toBeVisible();

  const other = await browser.newContext({ baseURL });
  try {
    const imported = await other.newPage();
    await imported.goto('/');
    await imported.getByRole('button', { name: 'Történetszerkesztő', exact: true }).click();
    await imported.getByLabel('ZIP importálása').setInputFiles(zipPath!);
    await expect(imported.getByText('A kaland bekerült a helyi könyvtárba.')).toBeVisible();
    await imported.getByRole('button', { name: 'Könyvespolc', exact: true }).click();
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
  await page.getByRole('button', { name: 'Karakterek', exact: true }).click();
  await page.getByRole('button', { name: 'Új karakter' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Nara');
  await page.getByLabel('Saját portré feltöltése').setInputFiles('public/icons/icon-192.png');
  await expect(page.locator('form img')).toHaveAttribute('src', /^data:image\/jpeg/);
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await expect(page.getByRole('heading', { name: 'Nara' })).toBeVisible();

  for (const title of ['Csendes Jel', 'A ködlámpás őre']) {
    await page.getByRole('button', { name: 'Könyvespolc', exact: true }).click();
    await card(title).getByRole('button', { name: 'Kaland megnyitása' }).click();
    await page.getByRole('button', { name: 'Új játék' }).click();
    await expect(page.getByText('Nara', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kész hősök' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Kaland indítása' }).click();
    await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Nara');
  }
  await page.getByRole('button', { name: 'Karakterek', exact: true }).click();
  await page.getByRole('button', { name: 'Új karakter' }).click();
  await page.getByRole('button', { name: 'Véletlen karakter' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Orin');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByLabel('Csendes Jel', { exact: false }).selectOption({ label: 'Orin' });
  await page.reload();
  await card('Csendes Jel').getByRole('button', { name: 'Folytatás' }).click();
  await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Nara');
  await page.getByRole('button', { name: 'Főmenü', exact: true }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await expect(page.getByText('Orin', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
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
  for (const title of ['Csendes Jel', 'A ködlámpás őre']) {
    await card(title).getByRole('button', { name: 'Kaland megnyitása' }).click();
    await expect(page.getByRole('button', { name: 'Saját karakter létrehozása' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Új játék', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Könyvespolc', exact: true }).click();
  }
  await card('Csendes Jel').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Saját karakter létrehozása' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Csak az enyém');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Új játék', exact: true }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByLabel('Nyelv').selectOption('en');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bookshelf' })).toBeVisible();
  await card('Silent Signal').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Character sheet' })).toContainText(
    'Csak az enyém',
  );

  const another = await browser.newContext({ baseURL });
  try {
    const newcomer = await another.newPage();
    await newcomer.goto('/');
    await expect(newcomer.getByRole('heading', { name: 'Könyvespolc' })).toBeVisible();
    await expect(newcomer.getByRole('heading', { name: 'Csendes Jel' })).toBeVisible();
    await expect(newcomer.getByRole('button', { name: 'Folytatás', exact: true })).toHaveCount(0);
    await newcomer.getByRole('button', { name: 'Karakterek', exact: true }).click();
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
  const book = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Csendes Jel', exact: true }) });
  await book.getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Saját karakter létrehozása' }).click();
  await page.getByLabel('Név', { exact: true }).fill('Átmeneti');
  await page.getByRole('button', { name: 'Karakter mentése' }).click();
  await page.getByRole('button', { name: 'Új játék', exact: true }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: 'Könyvespolc', exact: true }).click();
  await book.getByRole('button', { name: 'Folytatás', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Karakterlap' })).toContainText('Átmeneti');
  await page.reload();
  await book.getByRole('button', { name: 'Kaland megnyitása' }).click();
  await expect(page.getByRole('button', { name: 'Saját karakter létrehozása' })).toBeVisible();
});
