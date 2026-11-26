import { test, expect } from '@playwright/test';

test('saját hős, angol nyelvváltás, nehézség és független automentések', async ({ page }) => {
  await page.goto('/');
  const card = (title: string) =>
    page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await card('Csendes Jel').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await page.getByRole('button', { name: /főbejáraton/i }).click();
  await expect(page.getByRole('heading', { name: 'Főzsilip', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Kalandkönyvtár' }).click();
  await card('A ködlámpás őre').getByRole('button', { name: 'Kaland megnyitása' }).click();
  await page.getByRole('button', { name: 'Új játék' }).click();
  await page.getByRole('button', { name: 'Saját karakter', exact: true }).click();
  await page.getByLabel('Név', { exact: true }).fill('Alma');
  await page.getByRole('spinbutton', { name: /Figyelem/ }).fill('2');
  await page.getByRole('button', { name: 'Karakter használata' }).click();
  await page.getByLabel('Játékmód').selectOption('2');
  await page.getByRole('button', { name: 'Kaland indítása' }).click();
  await expect(page.getByTestId('stat-figyelem')).toContainText('9');
  await page.getByLabel('Nyelv').selectOption('en');
  await expect(page.getByRole('heading', { name: 'The shore' })).toBeVisible();
  await expect(page.getByText('Alma', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /source of the ringing/ }).click();
  await expect(page.getByRole('status')).toContainText(/9 \+ 2/);

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
    await imported.getByLabel('ZIP importálása').setInputFiles(zipPath!);
    const card = imported
      .locator('article')
      .filter({ has: imported.getByRole('heading', { name: 'A titkos kapu' }) });
    await card.getByRole('button', { name: 'Kaland megnyitása' }).click();
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
