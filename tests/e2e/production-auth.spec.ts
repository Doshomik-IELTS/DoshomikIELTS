import { test, expect } from "@playwright/test";

test.describe("Production Auth Smoke", () => {
  test("Supabase auth callback route exists and responds", async ({ request }) => {
    const response = await request.get("/auth/callback");
    expect([200, 302, 405]).toContain(response.status());
  });

  test("login page renders Supabase auth path in production mode", async ({ page }) => {
    await page.goto("/login");
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("session cookie propagation via dev-auth for CI", async ({ page }) => {
    const response = await page.request.post("/api/dev-auth/login", {
      data: { email: "ci-learner@doshomikielts.local", password: "Test@1234!", role: "learner" },
    });
    expect(response.ok()).toBeTruthy();

    const cookies = response.headers()["set-cookie"];
    expect(cookies).toBeTruthy();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("protected API routes reject unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/attempts");
    expect([401, 403]).toContain(response.status());
  });
});
