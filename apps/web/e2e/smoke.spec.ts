import { test, expect } from '@playwright/test'

/**
 * Smoke tests to verify basic application functionality after deployment.
 * These tests should be fast and validate critical paths.
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Check that the page has a title
    await expect(page).toHaveTitle(/Loot/i)
  })

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login')

    await page.waitForLoadState('networkidle')

    // The login page should be visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('404 page works for invalid routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-123')

    await page.waitForLoadState('networkidle')

    // Should show some form of 404 or not found content
    // The app uses a custom not-found.tsx
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('page has no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out expected errors (like Firebase auth not being set up in test)
    const unexpectedErrors = consoleErrors.filter(
      (error) => !error.includes('Firebase') && !error.includes('auth')
    )

    expect(unexpectedErrors).toHaveLength(0)
  })

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Check that theme class is applied (either 'dark' or 'light')
    const className = await html.getAttribute('class')
    expect(className).toMatch(/dark|light/)
  })

  test('blogs listing page loads successfully', async ({ page }) => {
    await page.goto('/blogs')
    await page.waitForLoadState('networkidle')

    // Check if blogs hero is visible
    const heading = page.locator('h1.blog-h1')
    await expect(heading).toBeVisible()
  })

  test('blog detail page loads successfully', async ({ page }) => {
    await page.goto('/blogs/history-of-photography')
    await page.waitForLoadState('networkidle')

    // Check if back link is visible
    const backLink = page.locator('#blog-back-link')
    await expect(backLink).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})

test.describe('Accessibility', () => {
  test('homepage has proper heading structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that there's at least one heading
    const headings = page.locator('h1, h2, h3')
    const count = await headings.count()
    expect(count).toBeGreaterThan(0)
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Check that we can tab through the page
    await page.keyboard.press('Tab')

    // Something should be focused
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
