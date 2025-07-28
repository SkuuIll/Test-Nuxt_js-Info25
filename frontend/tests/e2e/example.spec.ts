import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // Check if the page title is correct
  await expect(page).toHaveTitle(/Blog de Noticias/)
  
  // Check if the main navigation is present
  await expect(page.locator('nav')).toBeVisible()
})