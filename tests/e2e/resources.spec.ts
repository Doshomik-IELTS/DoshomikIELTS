import { test, expect } from "@playwright/test";

test.describe("Resources", () => {
  test("resources page loads", async ({ page }) => {
    await page.goto("/resources");
    await expect(page.getByText(/resources/i)).toBeVisible({ timeout: 10000 });
  });
});