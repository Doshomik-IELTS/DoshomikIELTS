import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[id="email"]', "demo@ieltspp.local");
  await page.fill('input[id="password"]', "Test@1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 15000 });
});

test.describe("Detail Pages", () => {
  test("should load resource detail", async ({ page }) => {
    await page.goto("/resources");
    const firstResource = page.locator("a[href*='/resources/']").first();
    if (await firstResource.isVisible()) {
      const resourceTitle = (await firstResource.textContent())?.trim() ?? "";
      await firstResource.click();
      await expect(page).toHaveURL(/\/resources\//);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(resourceTitle);
      await expect(page.locator(".content-body").first()).toBeVisible();
    }
  });

  test("should load flashcard deck detail", async ({ page }) => {
    await page.goto("/flashcards");
    const firstDeck = page.locator("a[href*='/flashcards/']").first();
    if (await firstDeck.isVisible()) {
      await firstDeck.click();
      await expect(page.url()).toContain("/flashcards/");
    }
  });

  test("should load practice detail", async ({ page }) => {
    await page.goto("/practice");
    const firstPractice = page.locator("a[href*='/practice/']").first();
    if (await firstPractice.isVisible()) {
      await firstPractice.click();
      await expect(page.url()).toContain("/practice/");
    }
  });

  test("should load mock-test detail", async ({ page }) => {
    await page.goto("/mock-tests");
    const firstTest = page.locator("a[href*='/mock-tests/']").first();
    if (await firstTest.isVisible()) {
      await firstTest.click();
      await expect(page.url()).toContain("/mock-tests/");
    }
  });
});
