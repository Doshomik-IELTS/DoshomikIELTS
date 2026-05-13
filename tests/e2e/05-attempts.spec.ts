import { test, expect } from "@playwright/test";

test.describe("Attempt Pages", () => {
  test("should load attempts page when attempt exists", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@ieltspp.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 15000 });
    
    await page.goto("/mock-tests");
    const startButton = page.locator("button:has-text('Start'), a:has-text('Start')").first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await expect(page.url()).toMatch(/\/attempts\/.+/);
    }
  });
});

test.describe("Evaluation Pages", () => {
  test("should load evaluations page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "demo@ieltspp.local");
    await page.fill('input[id="password"]', "Test@1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 15000 });
    
    await page.goto("/evaluations");
    await expect(page.locator("h1")).toContainText(/evaluation/i);
  });
});