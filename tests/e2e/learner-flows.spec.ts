import { expect, test } from "@playwright/test";
import { DEV_AUTH } from "../../src/config/dev-auth";

async function loginAsDemoUser(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEV_AUTH.email);
  await page.getByLabel("Password").fill(DEV_AUTH.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard(\/|$|\?)/, { timeout: 10000 });
}

test.describe("learner dashboard", () => {
  test("dashboard shows user info and navigation links", async ({ page }) => {
    await loginAsDemoUser(page);

    await expect(page.getByText(/Welcome back, Demo Learner/i)).toBeVisible();
    
    await expect(page.getByRole("link", { name: "Resources", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Practice", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mock Tests", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
  });
});

test.describe("resources page", () => {
  test("resources page loads and displays content", async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole("link", { name: /Resources/i }).click();
    await page.waitForURL(/\/resources/);
    await expect(page.getByRole("heading", { name: /Resources/i })).toBeVisible();
  });
});

test.describe("practice page", () => {
  test("practice page loads and displays practice options", async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole("link", { name: /Practice/i }).click();
    await page.waitForURL(/\/practice/);
    await expect(page.getByRole("heading", { name: /Practice/i })).toBeVisible();
  });
});

test.describe("mock tests page", () => {
  test("mock tests page loads", async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole("link", { name: /Mock Tests/i }).click();
    await page.waitForURL(/\/mock-tests/);
    await expect(page.getByRole("heading", { name: /Mock Tests/i })).toBeVisible();
  });
});

test.describe("profile page", () => {
  test("profile page loads user data", async ({ page }) => {
    await loginAsDemoUser(page);

    await page.getByRole("link", { name: /Profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { name: /Profile/i }).first()).toBeVisible();
  });

test("profile page has form fields", async ({ page }) => {
    await loginAsDemoUser(page);
    
    await page.getByRole("link", { name: "Profile", exact: true }).click();
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Target band")).toBeVisible();
    await expect(page.getByLabel("Native language")).toBeVisible();
  });
});
