import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "demo@doshomikielts.local";
const DEMO_PASSWORD = "Test@1234!";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.fill('input[id="email"]', DEMO_EMAIL);
  await page.fill('input[id="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 15000 });
}

async function loginAsAdmin(page: Page) {
  const response = await page.request.post("/api/dev-auth/login", {
    data: { email: "admin@doshomikielts.local", password: DEMO_PASSWORD, role: "admin" },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/admin");
}

async function openSeededMockTest(page: Page) {
  await page.goto("/mock-tests/demo-short-mock-1");
  await expect(page.getByRole("heading", { name: /practice test 1/i })).toBeVisible();
}

async function startSeededMockAttempt(page: Page) {
  await openSeededMockTest(page);
  await page.getByRole("button", { name: /start test/i }).click();
  await expect(page).toHaveURL(/\/attempts\/.+/, { timeout: 15000 });
  const match = page.url().match(/\/attempts\/([^/?#]+)/);
  expect(match).toBeTruthy();
  return match?.[1] ?? "";
}

test.describe("Launch Gates", () => {
  test("learner can log in and reach the dashboard", async ({ page }) => {
    await loginAsDemo(page);
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("learner can log out", async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("resources page loads and opens a published resource", async ({ page }) => {
    await loginAsDemo(page);
    await page.goto("/resources");
    await expect(page.getByRole("heading", { name: /resources/i })).toBeVisible();

    const resourceLink = page.locator("a[href*='/resources/']").first();
    await expect(resourceLink).toBeVisible();
    await resourceLink.click();
    await expect(page).toHaveURL(/\/resources\/.+/, { timeout: 10000 });
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("mock test detail loads with sections and credit guidance", async ({ page }) => {
    await loginAsDemo(page);
    await openSeededMockTest(page);

    await expect(page.getByText(/1 credit is required/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /sections/i })).toBeVisible();
  });

  test("learner can start the seeded mock test and land on the attempt page", async ({ page }) => {
    await loginAsDemo(page);
    await startSeededMockAttempt(page);

    await expect(page.getByRole("heading", { name: /section 1 of/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^listening/i })).toBeVisible();
  });

  test("score prediction is blocked for incomplete attempts", async ({ page }) => {
    await loginAsDemo(page);
    const attemptId = await startSeededMockAttempt(page);

    const response = await page.request.get(`/api/attempts/${attemptId}/predict-score`);
    expect([400, 404]).toContain(response.status());
  });

  test("admin dashboard loads", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
