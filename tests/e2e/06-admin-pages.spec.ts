import { test, expect } from "@playwright/test";

test.describe("Admin Pages", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.post("/api/dev-auth/login", {
      data: {
        email: "admin@ieltspp.local",
        password: "Test@1234!",
        role: "admin"
      }
    });
    expect(response.ok()).toBeTruthy();
    await page.goto("/admin");
  });
  
  test("should load admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should load admin resources", async ({ page }) => {
    await page.goto("/admin/resources");
    await expect(page.locator("h1")).toContainText(/resource/i);
  });

  test("should load admin tests", async ({ page }) => {
    await page.goto("/admin/tests");
    await expect(page.locator("h1")).toContainText(/test/i);
  });

  test("should load admin flashcards", async ({ page }) => {
    await page.goto("/admin/flashcards");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("should load admin reviews", async ({ page }) => {
    await page.goto("/admin/reviews");
    await expect(page.locator("h1")).toContainText(/review/i);
  });

  test("should load admin new resource page", async ({ page }) => {
    await page.goto("/admin/resources/new");
    await expect(page.locator("h1")).toContainText(/new resource|create/i);
  });

  test("should load admin new test page", async ({ page }) => {
    await page.goto("/admin/tests/new");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});