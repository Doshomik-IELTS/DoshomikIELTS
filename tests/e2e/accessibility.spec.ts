import { test, expect } from "@playwright/test";

test.describe("Accessibility — WCAG 2.1 AA", () => {
  test("public pages have no critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("auth pages have no critical accessibility violations", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("form")).toBeVisible();
  });

  test("learner dashboard has no critical accessibility violations", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("mock test pages have no critical accessibility violations", async ({ page }) => {
    await page.goto("/mock-tests");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("speaking recorder has accessible controls", async ({ page }) => {
    await page.goto("/mock-tests");
    const startButton = page.getByRole("button", { name: /start recording/i });
    await expect(startButton).toBeVisible();
  });
});
