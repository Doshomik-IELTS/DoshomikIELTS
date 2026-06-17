import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:3002";
const OUT_DIR = "/mnt/data/wd/10_project/projects/DOshomik IELTS/screenshots";

const PAGES = [
  { path: "/", name: "01-landing" },
  { path: "/login", name: "02-login" },
  { path: "/register", name: "03-register" },
  { path: "/reset-password", name: "04-reset-password" },
  { path: "/dashboard", name: "05-dashboard", login: true },
  { path: "/resources", name: "06-resources", login: true },
  { path: "/practice", name: "07-practice", login: true },
  { path: "/mock-tests", name: "08-mock-tests", login: true },
  { path: "/profile", name: "09-profile", login: true },
  { path: "/admin", name: "10-admin", login: true, admin: true },
  { path: "/admin/resources", name: "11-admin-resources", login: true, admin: true },
  { path: "/admin/tests", name: "12-admin-tests", login: true, admin: true },
  { path: "/admin/reviews", name: "13-admin-reviews", login: true, admin: true },
];

async function loginAs(page, email, password) {
  await page.goto(BASE_URL + "/login");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const { path, name, login: needsLogin, admin } of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const filename = OUT_DIR + "/" + name + ".png";

    try {
      if (needsLogin) {
        const email = admin ? "admin@doshomikielts.local" : "demo@doshomikielts.local";
        const password = "Test@1234!";
        await loginAs(page, email, password);
      }

      await page.goto(BASE_URL + path, { timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: filename, fullPage: true });
      console.log("  [OK] " + path + " -> " + name + ".png");
    } catch (err) {
      console.error("  [ERR] " + path + ": " + err.message);
    }

    await context.close();
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
