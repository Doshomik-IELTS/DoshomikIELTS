import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[id="email"]', "demo@ieltspp.local");
  await page.fill('input[id="password"]', "Test@1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 15000 });
});

test.describe("Learner Pages", () => {
  test("should load dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should load profile page", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("h1")).toContainText(/profile/i);
  });

  test("should load resources page", async ({ page }) => {
    await page.goto("/resources");
    await expect(page.locator("h1")).toContainText(/resource/i);
  });

  test("should load flashcards page", async ({ page }) => {
    await page.goto("/flashcards");
    await expect(page.locator("h1")).toContainText(/flashcard/i);
  });

  test("should load practice page", async ({ page }) => {
    await page.goto("/practice");
    await expect(page.locator("h1")).toContainText(/practice/i);
  });

  test("should load mock-tests page", async ({ page }) => {
    await page.goto("/mock-tests");
    await expect(page.locator("h1")).toContainText(/mock/i);
  });

  test("should load referrals page", async ({ page }) => {
    await page.goto("/referrals");
    await expect(page.locator("h1")).toContainText(/referral/i);
  });
});