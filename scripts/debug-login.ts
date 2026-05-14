import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));

  // Test 1: Login page loads
  await page.goto("http://127.0.0.1:3002/login");
  await page.waitForLoadState("networkidle");
  console.log("Login page URL:", page.url());
  console.log("Page title:", await page.title());

  const emailInput = await page.$('input[id="email"]');
  const passInput = await page.$('input[id="password"]');
  const submitBtn = await page.$('button[type="submit"]');
  console.log("email input:", !!emailInput);
  console.log("password input:", !!passInput);
  console.log("submit btn:", !!submitBtn);

  // Test 2: Fill and submit login form
  await page.fill('input[id="email"]', "demo@ieltspp.local");
  await page.fill('input[id="password"]', "Test@1234!");
  await page.click('button[type="submit"]');

  // Wait for network to settle
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  console.log("After submit URL:", page.url());

  const cookies = await context.cookies();
  const devCookie = cookies.find((c) => c.name === "ieltspp-dev-session");
  console.log("Dev session cookie present:", !!devCookie);
  if (devCookie) {
    console.log("  value:", devCookie.value.slice(0, 30) + "...");
  }

  // Test 3: Navigate to dashboard directly
  await page.goto("http://127.0.0.1:3002/dashboard");
  await page.waitForLoadState("networkidle");
  console.log("Dashboard URL:", page.url());
  const h1 = await page
    .$eval("h1", (el) => el.textContent)
    .catch(() => "no h1 found");
  console.log("Dashboard h1:", h1);

  // Test 4: Profile page
  await page.goto("http://127.0.0.1:3002/profile");
  await page.waitForLoadState("networkidle");
  console.log("Profile URL:", page.url());
  const profileH1 = await page
    .$eval("h1", (el) => el.textContent)
    .catch(() => "no h1 found");
  console.log("Profile h1:", profileH1);

  // Test 5: Resources page
  await page.goto("http://127.0.0.1:3002/resources");
  await page.waitForLoadState("networkidle");
  console.log("Resources URL:", page.url());
  const resH1 = await page
    .$eval("h1", (el) => el.textContent)
    .catch(() => "no h1 found");
  console.log("Resources h1:", resH1);

  // Test 6: Practice page
  await page.goto("http://127.0.0.1:3002/practice");
  await page.waitForLoadState("networkidle");
  console.log("Practice URL:", page.url());
  const prH1 = await page
    .$eval("h1", (el) => el.textContent)
    .catch(() => "no h1 found");
  console.log("Practice h1:", prH1);

  // Test 7: Mock tests page
  await page.goto("http://127.0.0.1:3002/mock-tests");
  await page.waitForLoadState("networkidle");
  console.log("Mock Tests URL:", page.url());
  const mtH1 = await page
    .$eval("h1", (el) => el.textContent)
    .catch(() => "no h1 found");
  console.log("Mock Tests h1:", mtH1);

  // Test 8: Admin login + access
  await page.goto("http://127.0.0.1:3002/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[id="email"]', "admin@ieltspp.local");
  await page.fill('input[id="password"]', "Test@1234!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log("Admin after login URL:", page.url());

  await page.goto("http://127.0.0.1:3002/admin");
  await page.waitForLoadState("networkidle");
  console.log("Admin URL:", page.url());
  const adminH1 = await page
    .$eval("h1", (el) => el.textContent)
    .catch(() => "no h1 found");
  console.log("Admin h1:", adminH1);

  // Test 9: Reset password page
  await page.goto("http://127.0.0.1:3002/reset-password");
  await page.waitForLoadState("networkidle");
  console.log("Reset password URL:", page.url());
  const hasEmail = await page
    .$('input[type="email"]')
    .then((el) => !!el)
    .catch(() => false);
  console.log("Reset password has email input:", hasEmail);

  await browser.close();
  console.log("\nAll tests done.");
}

main().catch(console.error);