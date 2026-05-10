import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders the IELTS++ landing page and primary sections", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Build foundations, practise smarter, and complete IELTS-style mock tests/i,
      }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /Get started/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Login/i })).toBeVisible();

    await expect(page.getByRole("heading", { name: /Everything needed for a complete IELTS practice loop/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Listening" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reading" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Writing" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Speaking" })).toBeVisible();

    await expect(page.getByText(/unofficial IELTS band estimate/i)).toBeVisible();
    await expect(page.getByText(/No copied IELTS book material/i)).toBeVisible();
  });

  test("navigates to auth pages from landing CTAs", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Start learning/i }).click();
    await page.waitForURL(/\/register/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: /Login/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });
});
