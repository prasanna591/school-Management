import { test, expect } from '@playwright/test'

test.describe('SmartSchool Web Dashboard', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveTitle(/SmartSchool/)
    await expect(page.getByText('SmartSchool')).toBeVisible()
  })

  test('dashboard loads after login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('students page loads', async ({ page }) => {
    await page.goto('/students')
    await expect(page.getByText('Students')).toBeVisible()
  })

  test('fees page loads', async ({ page }) => {
    await page.goto('/fees')
    await expect(page.getByText('Fees')).toBeVisible()
  })

  test('admissions page loads', async ({ page }) => {
    await page.goto('/admissions')
    await expect(page.getByText('Admissions CRM')).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('text=Students')
    await expect(page.getByText('Students')).toBeVisible()
  })

  test('sign out works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('text=Sign out')
    await expect(page.getByText('SmartSchool')).toBeVisible()
  })
})
