import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility — WCAG 2.1 AA", () => {
  test("public home page has no critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("mock tests listing page has no critical accessibility violations", async ({ page }) => {
    await page.goto("/mock-tests");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("resources page has no critical accessibility violations", async ({ page }) => {
    await page.goto("/resources");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("speaking recorder has accessible controls", async ({ page }) => {
    await page.goto("/mock-tests");
    const startButton = page.getByRole("button", { name: /start test/i });
    await expect(startButton).toBeVisible();
  });
});
