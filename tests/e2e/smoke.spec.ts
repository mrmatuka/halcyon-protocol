import { test, expect } from '@playwright/test';

test('az alkalmazás betölt és megjeleníti a címet', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'Főmenü' })).toBeVisible();
  await page.getByRole('button', { name: 'Új kaland' }).click();
  await expect(page.getByRole('heading', { name: 'Könyvkaland' })).toBeVisible();
});
