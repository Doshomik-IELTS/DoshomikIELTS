import { expect, test } from "@playwright/test";

test.describe("route protection", () => {
  test("logged-out learner route redirects to login with next path", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=\/dashboard/);
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("logged-out admin route redirects to login with next path", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login\?next=\/admin/);
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });
});
