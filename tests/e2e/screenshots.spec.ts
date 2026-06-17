import { test } from "@playwright/test";

test.describe("Public Pages Screenshots", () => {
  const publicPages = [
    { url: "/", name: "01-landing" },
    { url: "/login", name: "02-login" },
    { url: "/register", name: "03-register" },
    { url: "/reset-password", name: "04-reset-password" },
    { url: "/changelog", name: "05-changelog" },
  ];

  for (const p of publicPages) {
    test(p.name, async ({ page }) => {
      await page.goto(`http://localhost:3002${p.url}`);
      await page.screenshot({ path: `screenshots/${p.name}.png`, fullPage: true });
    });
  }
});

test.describe("Learner Pages Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3002");
    await page.request.post("http://localhost:3002/api/dev-auth/login", {
      data: { email: "demo@doshomikielts.local", password: "Test@1234!", role: "learner" }
    });
  });

  const learnerPages = [
    { url: "/welcome", name: "06-welcome" },
    { url: "/dashboard", name: "07-dashboard" },
    { url: "/profile", name: "08-profile" },
    { url: "/resources", name: "09-resources" },
    { url: "/flashcards", name: "10-flashcards" },
    { url: "/practice", name: "11-practice" },
    { url: "/mock-tests", name: "12-mock-tests" },
    { url: "/referrals", name: "13-referrals" },
    { url: "/mock-tests/demo-short-mock-1", name: "14-mock-test-detail" },
  ];

  for (const p of learnerPages) {
    test(p.name, async ({ page }) => {
      await page.goto(`http://localhost:3002${p.url}`);
      await page.screenshot({ path: `screenshots/${p.name}.png`, fullPage: true });
    });
  }
});

test.describe("Admin Pages Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3002");
    await page.request.post("http://localhost:3002/api/dev-auth/login", {
      data: { email: "admin@doshomikielts.local", password: "Test@1234!", role: "admin" }
    });
  });

  const adminPages = [
    { url: "/admin", name: "15-admin-dashboard" },
    { url: "/admin/resources", name: "16-admin-resources" },
    { url: "/admin/tests", name: "17-admin-tests" },
    { url: "/admin/flashcards", name: "18-admin-flashcards" },
    { url: "/admin/reviews", name: "19-admin-reviews" },
  ];

  for (const p of adminPages) {
    test(p.name, async ({ page }) => {
      await page.goto(`http://localhost:3002${p.url}`);
      await page.screenshot({ path: `screenshots/${p.name}.png`, fullPage: true });
    });
  }
});
