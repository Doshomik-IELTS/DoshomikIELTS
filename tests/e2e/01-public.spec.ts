import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should load landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, [class*='text-']").first()).toBeVisible();
  });

  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[id="email"], input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test("should load register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[id="email"], input[type="email"], input[name="email"]')).toBeVisible();
  });

  test("should load reset password page", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("should load changelog page", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.locator("h1")).toContainText(/changelog/i);
  });
});