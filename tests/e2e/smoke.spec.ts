import { test, expect } from '@playwright/test';

test('az alkalmazás betölt és megjeleníti a címet', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Csendes Jel' })).toBeVisible();
});
