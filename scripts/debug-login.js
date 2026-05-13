import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:3002";
const OUT_DIR = "/mnt/data/wd/10_project/projects/IELTS++/screenshots";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const page = await context.newPage();

  // Capture all network requests
  page.on("response", (response) => {
    if (response.url().includes("/api/")) {
      console.log("  [" + response.status() + "] " + response.url());
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("  [CONSOLE ERROR] " + msg.text());
    }
  });

  await page.goto(BASE_URL + "/login");
  await page.waitForTimeout(3000);

  await page.fill('input[id="email"]', "demo@ieltspp.local");
  await page.fill('input[id="password"]', "Test@1234!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  console.log("\nFinal URL:", page.url());

  await page.screenshot({ path: OUT_DIR + "/debug-login.png", fullPage: true });
  console.log("Saved debug screenshot");

  await browser.close();
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
