import { test, expect } from '@playwright/test';

test('a Súgó mobilon, magyarul és angolul is megnyitható játék közben', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 630 });
  await page.goto('/');
  const settings = page.getByRole('button', { name: 'Beállítások', exact: true });
  await settings.click();
  const helpButton = page.getByRole('button', { name: 'Súgó', exact: true });
  await helpButton.click();
  const help = page.getByRole('dialog', { name: 'Súgó' });
  await expect(help).toBeVisible();
  await expect(help).toBeInViewport({ ratio: 1 });
  await help.getByText('Tájékozódás a felületen', { exact: true }).click();
  await expect(help.locator('dt', { hasText: 'Főmenü' }).locator('svg')).toBeVisible();
  await help.getByText('Karakter létrehozása és hozzárendelése', { exact: true }).click();
  await expect(help.getByText('Összes kaland és mentés', { exact: true })).toBeVisible();
  await help.getByText('Kaland szerkesztése, importálása és megosztása', { exact: true }).click();
  await expect(help.getByText('Ellenőrzés, mentés és ZIP', { exact: true })).toBeVisible();
  await help.getByRole('button', { name: 'Bezárás' }).click();
  await expect(help).toHaveCount(0);
  await expect(helpButton).toBeFocused();

  await page.getByLabel('Nyelv').selectOption('en');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  const englishHelp = page.getByRole('dialog', { name: 'Help' });
  await expect(englishHelp.getByText('Finding your way', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(englishHelp).toHaveCount(0);

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'New adventure', exact: true }).click();
  await page
    .getByRole('article')
    .filter({ hasText: 'Silent Signal' })
    .getByRole('button', { name: 'Open adventure' })
    .click();
  await page.getByRole('button', { name: 'Create your character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Alma');
  await page.getByRole('button', { name: 'Save character' }).click();
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start adventure' }).click();
  const scene = page.locator('#scene-heading');
  await expect(scene).toBeVisible();
  const title = await scene.innerText();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await englishHelp.getByText('Journal, equipment, and saves', { exact: true }).click();
  await expect(englishHelp.getByText('Save / load', { exact: true })).toBeVisible();
  await englishHelp.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(scene).toHaveText(title);
  await expect(page.getByRole('region', { name: 'Choices' })).toBeVisible();
});
