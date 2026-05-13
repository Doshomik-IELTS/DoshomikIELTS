import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login with dev credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@ieltspp.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard", { timeout: 15000 });
  });

  test("should redirect to dashboard when logged in user visits login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@ieltspp.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    
    await page.goto("/login");
    await expect(page).toHaveURL("/dashboard");
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@ieltspp.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    
    await page.click('button:has-text("Logout"), [class*="logout"]');
    await expect(page).toHaveURL("/login");
  });
});