import { test, expect } from '@playwright/test'

test.describe('Toast System E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to test page
        await page.goto('/test-toast')
    })

    test('displays success toast', async ({ page }) => {
        // Click success toast button
        await page.click('[data-testid="success-toast-btn"]')

        // Check if toast appears
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Check toast content
        await expect(toast.locator('[data-testid="toast-title"]')).toContainText('Success')
        await expect(toast.locator('[data-testid="toast-message"]')).toContainText('Operation completed successfully')

        // Check toast styling
        await expect(toast).toHaveClass(/toast-success/)
    })

    test('displays error toast', async ({ page }) => {
        // Click error toast button
        await page.click('[data-testid="error-toast-btn"]')

        // Check if toast appears
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Check toast content
        await expect(toast.locator('[data-testid="toast-title"]')).toContainText('Error')
        await expect(toast.locator('[data-testid="toast-message"]')).toContainText('Something went wrong')

        // Check toast styling
        await expect(toast).toHaveClass(/toast-error/)
    })

    test('displays warning toast', async ({ page }) => {
        // Click warning toast button
        await page.click('[data-testid="warning-toast-btn"]')

        // Check if toast appears
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Check toast content
        await expect(toast.locator('[data-testid="toast-title"]')).toContainText('Warning')
        await expect(toast.locator('[data-testid="toast-message"]')).toContainText('Please be careful')

        // Check toast styling
        await expect(toast).toHaveClass(/toast-warning/)
    })

    test('displays info toast', async ({ page }) => {
        // Click info toast button
        await page.click('[data-testid="info-toast-btn"]')

        // Check if toast appears
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Check toast content
        await expect(toast.locator('[data-testid="toast-title"]')).toContainText('Info')
        await expect(toast.locator('[data-testid="toast-message"]')).toContainText('Here is some information')

        // Check toast styling
        await expect(toast).toHaveClass(/toast-info/)
    })

    test('closes toast when close button is clicked', async ({ page }) => {
        // Show a toast
        await page.click('[data-testid="success-toast-btn"]')

        // Wait for toast to appear
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Click close button
        await page.click('[data-testid="toast-close"]')

        // Toast should disappear
        await expect(toast).not.toBeVisible()
    })

    test('auto-removes toast after duration', async ({ page }) => {
        // Show a toast with short duration
        await page.click('[data-testid="short-duration-toast-btn"]')

        // Wait for toast to appear
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Wait for auto-removal (assuming 2 second duration)
        await page.waitForTimeout(2500)

        // Toast should disappear
        await expect(toast).not.toBeVisible()
    })

    test('pauses auto-removal on hover', async ({ page }) => {
        // Show a toast with medium duration
        await page.click('[data-testid="medium-duration-toast-btn"]')

        // Wait for toast to appear
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Hover over toast
        await toast.hover()

        // Wait for what would normally be the auto-removal time
        await page.waitForTimeout(3500)

        // Toast should still be visible while hovering
        await expect(toast).toBeVisible()

        // Move mouse away
        await page.mouse.move(0, 0)

        // Wait for auto-removal to resume
        await page.waitForTimeout(3500)

        // Toast should now disappear
        await expect(toast).not.toBeVisible()
    })

    test('displays multiple toasts', async ({ page }) => {
        // Show multiple toasts
        await page.click('[data-testid="success-toast-btn"]')
        await page.click('[data-testid="error-toast-btn"]')
        await page.click('[data-testid="warning-toast-btn"]')

        // Check if multiple toasts are visible
        const toasts = page.locator('[data-testid="toast-notification"]')
        await expect(toasts).toHaveCount(3)
    })

    test('limits maximum number of toasts', async ({ page }) => {
        // Show many toasts quickly
        for (let i = 0; i < 10; i++) {
            await page.click('[data-testid="success-toast-btn"]')
            await page.waitForTimeout(100) // Small delay between clicks
        }

        // Check that only maximum allowed toasts are visible (assuming max 5)
        const toasts = page.locator('[data-testid="toast-notification"]')
        const count = await toasts.count()
        expect(count).toBeLessThanOrEqual(5)
    })

    test('displays toast with action button', async ({ page }) => {
        // Show toast with action
        await page.click('[data-testid="action-toast-btn"]')

        // Check if toast appears with action button
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        const actionButton = toast.locator('[data-testid="toast-action"]')
        await expect(actionButton).toBeVisible()
        await expect(actionButton).toContainText('Retry')

        // Click action button
        await actionButton.click()

        // Check if action was executed (this would depend on implementation)
        // For example, it might show another toast or navigate somewhere
    })

    test('clears all toasts', async ({ page }) => {
        // Show multiple toasts
        await page.click('[data-testid="success-toast-btn"]')
        await page.click('[data-testid="error-toast-btn"]')
        await page.click('[data-testid="warning-toast-btn"]')

        // Verify toasts are visible
        const toasts = page.locator('[data-testid="toast-notification"]')
        await expect(toasts.first()).toBeVisible()

        // Clear all toasts
        await page.click('[data-testid="clear-all-toasts-btn"]')

        // All toasts should disappear
        await expect(toasts).toHaveCount(0)
    })

    test('displays persistent toast', async ({ page }) => {
        // Show persistent toast (duration: 0)
        await page.click('[data-testid="persistent-toast-btn"]')

        // Check if toast appears
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Wait longer than normal auto-removal time
        await page.waitForTimeout(10000)

        // Toast should still be visible (persistent)
        await expect(toast).toBeVisible()

        // Must be manually closed
        await page.click('[data-testid="toast-close"]')
        await expect(toast).not.toBeVisible()
    })

    test('displays auth success toast', async ({ page }) => {
        // Show auth success toast
        await page.click('[data-testid="auth-success-toast-btn"]')

        // Check if toast appears with auth styling
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        await expect(toast.locator('[data-testid="toast-title"]')).toContainText('Autenticación')
        await expect(toast.locator('[data-testid="toast-message"]')).toContainText('Login successful')
    })

    test('displays auth error toast', async ({ page }) => {
        // Show auth error toast
        await page.click('[data-testid="auth-error-toast-btn"]')

        // Check if toast appears with auth error styling
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        await expect(toast.locator('[data-testid="toast-title"]')).toContainText('Error de Autenticación')
        await expect(toast.locator('[data-testid="toast-message"]')).toContainText('Login failed')
    })

    test('toast positioning and animations', async ({ page }) => {
        // Show a toast
        await page.click('[data-testid="success-toast-btn"]')

        // Check toast container positioning
        const container = page.locator('.toast-container')
        await expect(container).toHaveClass(/fixed/)
        await expect(container).toHaveClass(/top-4/)
        await expect(container).toHaveClass(/right-4/)
        await expect(container).toHaveClass(/z-50/)

        // Check toast animation classes
        const toast = page.locator('[data-testid="toast-notification"]')
        await expect(toast).toBeVisible()

        // Toast should have enter animation classes
        await expect(toast).toHaveClass(/transition-all/)
    })
})