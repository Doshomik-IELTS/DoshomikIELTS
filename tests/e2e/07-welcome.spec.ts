import { test, expect } from "@playwright/test";

test.describe("Welcome Page", () => {
  test("should load welcome page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@doshomikielts.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    
    await page.goto("/welcome");
    await expect(page.locator("h1")).toContainText(/welcome/i);
    await expect(page.locator("text=Go to Dashboard")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@doshomikielts.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 15000 });
  });

  test("should navigate via sidebar", async ({ page }) => {
    await page.click("text=Resources");
    await expect(page).toHaveURL("/resources");
    
    await page.click("text=Practice");
    await expect(page).toHaveURL("/practice");
    
    await page.click("text=Mock Tests");
    await expect(page).toHaveURL("/mock-tests");
  });
});