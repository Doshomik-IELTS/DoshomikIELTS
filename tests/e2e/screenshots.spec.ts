import { test } from "@playwright/test";

test("take all screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto("/");
  await page.screenshot({ path: "screenshots/01-landing.png", fullPage: true });
  
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/02-login.png", fullPage: true });
  
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/03-register.png", fullPage: true });
  
  await page.goto("/resources");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/04-resources.png", fullPage: true });
  
  await page.goto("/practice");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/05-practice.png", fullPage: true });
  
  await page.goto("/mock-tests");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/06-mock-tests.png", fullPage: true });
  
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill('demo@ieltspp.local');
  await page.locator("#password").fill('Test@1234!');
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/07-dashboard.png", fullPage: true });
  
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/08-profile.png", fullPage: true });
  
  await page.goto("/resources");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/09-resources-logged-in.png", fullPage: true });
  
  await page.goto("/practice");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/10-practice-logged-in.png", fullPage: true });
  
  await page.goto("/mock-tests");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/11-mock-tests-logged-in.png", fullPage: true });
  
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/12-admin-redirect.png", fullPage: true });
});