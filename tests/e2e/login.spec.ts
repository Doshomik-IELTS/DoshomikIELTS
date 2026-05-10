import { expect, test } from "@playwright/test";
import { DEV_AUTH } from "../../src/config/dev-auth";

test.describe("dev login", () => {
  test("logs in with the seeded demo user and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(DEV_AUTH.email);
    await page.getByLabel("Password").fill(DEV_AUTH.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard(\/|$|\?)/);
    await expect(page.getByText(/Welcome back, Demo Learner/i)).toBeVisible();
    await expect(page.getByText(/demo@ieltspp\.local/i)).toBeVisible();
  });
});
