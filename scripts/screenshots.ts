import { chromium, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "http://localhost:3002";

const pages = [
  { url: "/", name: "01-landing" },
  { url: "/login", name: "02-login" },
  { url: "/register", name: "03-register" },
  { url: "/reset-password", name: "04-reset-password" },
  { url: "/changelog", name: "05-changelog" },
  { url: "/welcome", name: "06-welcome", auth: true },
  { url: "/dashboard", name: "07-dashboard", auth: true },
  { url: "/profile", name: "08-profile", auth: true },
  { url: "/resources", name: "09-resources", auth: true },
  { url: "/flashcards", name: "10-flashcards", auth: true },
  { url: "/practice", name: "11-practice", auth: true },
  { url: "/mock-tests", name: "12-mock-tests", auth: true },
  { url: "/referrals", name: "13-referrals", auth: true },
  { url: "/attempts", name: "14-attempts", auth: true },
  { url: "/admin", name: "15-admin-dashboard", admin: true },
  { url: "/admin/resources", name: "16-admin-resources", admin: true },
  { url: "/admin/tests", name: "17-admin-tests", admin: true },
  { url: "/admin/flashcards", name: "18-admin-flashcards", admin: true },
  { url: "/admin/reviews", name: "19-admin-reviews", admin: true },
];

async function loginAsLearner(page: Page) {
  await page.goto("/");
  await page.request.post("/api/dev-auth/login", {
    data: { email: "demo@doshomikielts.local", password: "Test@1234!", role: "learner" }
  });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/");
  await page.request.post("/api/dev-auth/login", {
    data: { email: "admin@doshomikielts.local", password: "Test@1234!", role: "admin" }
  });
}

async function main() {
  const browser = await chromium.launch();
  const outputDir = path.join(process.cwd(), "screenshots");
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log(`Taking screenshots of ${pages.length} pages...`);

  for (const p of pages) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      if (p.admin) {
        await loginAsAdmin(page);
      } else if (p.auth) {
        await loginAsLearner(page);
      }
      
      await page.goto(BASE_URL + p.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      
      const screenshotPath = path.join(outputDir, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ ${p.name} (${p.url})`);
    } catch (e) {
      console.log(`❌ ${p.name}: ${e}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log("\nDone! Screenshots saved to /screenshots");
}

main().catch(console.error);
