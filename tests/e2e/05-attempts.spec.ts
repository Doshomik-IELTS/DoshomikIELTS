import { test, expect, type Page } from "@playwright/test";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.fill('input[id="email"]', "demo@ieltspp.local");
  await page.fill('input[id="password"]', "Test@1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 15000 });
}

async function startSeededMockAttempt(page: Page) {
  await page.goto("/mock-tests/demo-short-mock-1");
  await expect(page.getByRole("heading", { name: /practice test 1/i })).toBeVisible();
  await page.getByRole("button", { name: /start test/i }).click();
  await expect(page).toHaveURL(/\/attempts\/.+/, { timeout: 15000 });
  return page.url().split("/attempts/")[1];
}

test.describe("Attempt Pages", () => {
  test("starts a mock attempt and shows the learner attempt UI", async ({ page }) => {
    await loginAsDemo(page);
    await startSeededMockAttempt(page);

    await expect(page.getByRole("heading", { name: /section 1 of/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^listening/i })).toBeVisible();
  });
});

test.describe("Attempt Reports", () => {
  test("report page loads for a started attempt", async ({ page }) => {
    await loginAsDemo(page);
    const attemptId = await startSeededMockAttempt(page);

    await page.goto(`/attempts/${attemptId}/report`);
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
