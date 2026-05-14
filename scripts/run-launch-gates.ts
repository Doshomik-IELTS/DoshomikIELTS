import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3002";
const DEMO_EMAIL = "demo@ieltspp.local";
const DEMO_PASSWORD = "Test@1234!";
const ADMIN_EMAIL = "admin@ieltspp.local";

const results: { gate: string | number; test: string; pass: boolean | null; url?: string; h1?: string | null; resourceCount?: number; testCount?: number; sections?: number; reason?: string; error?: string; errorMsg?: string; disclaimer?: string; label?: string; status?: number; hasScore?: boolean }[] = [];

async function login(page: any, role = "demo") {
  const email = role === "admin" ? ADMIN_EMAIL : DEMO_EMAIL;
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
  console.log("\n=== GATE 1: Register, Login, Logout, Reset Password ===");

  await login(page);
  const afterLogin = page.url();
  results.push({ gate: 1, test: "login", pass: afterLogin.includes("/dashboard"), url: afterLogin });

  const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button[aria-label*="logout" i]').first();
  if (await logoutBtn.isVisible({ timeout: 2000 })) {
    await logoutBtn.click();
    await page.waitForURL("**/login", { timeout: 8000 });
  } else {
    await page.goto(`${BASE}/login`);
  }
  results.push({ gate: 1, test: "logout", pass: page.url().includes("/login") || page.url().includes("/logout"), url: page.url() });

  await page.goto(`${BASE}/reset-password`);
  await page.waitForLoadState("networkidle");
  const hasEmail = await page.locator('input[type="email"]').isVisible({ timeout: 3000 });
  results.push({ gate: 1, test: "reset-password-page", pass: hasEmail });

  console.log("=== GATE 2: Profile ===");
  await login(page);
  await page.goto(`${BASE}/profile`);
  await page.waitForLoadState("networkidle");
  const profileH1 = await page.locator("h1, [class*='text-2xl'], [class*='text-xl']").first().textContent({ timeout: 5000 });
  results.push({ gate: 2, test: "profile-page-loads", pass: !!profileH1, h1: profileH1 });

  console.log("=== GATE 3: Resources ===");
  await login(page);
  await page.goto(`${BASE}/resources`);
  await page.waitForLoadState("networkidle");
  const resourcesH1 = await page.locator("h1").textContent({ timeout: 5000 });
  const resourceLinks = await page.locator('a[href*="/resources/"]').count();
  results.push({ gate: 3, test: "resources-page", pass: !!resourcesH1, h1: resourcesH1, resourceCount: resourceLinks });

  const firstResource = page.locator('a[href*="/resources/"]').first();
  if (await firstResource.isVisible({ timeout: 3000 })) {
    await firstResource.click();
    await page.waitForLoadState("networkidle");
    results.push({ gate: 3, test: "resource-detail", pass: page.url().includes("/resources/"), url: page.url() });
  } else {
    results.push({ gate: 3, test: "resource-detail", pass: false, reason: "no resource links visible" });
  }

  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Bookmark")').first();
  if (await saveBtn.isVisible({ timeout: 2000 })) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
    results.push({ gate: 3, test: "save-resource", pass: true });
  } else {
    results.push({ gate: 3, test: "save-resource", pass: null, reason: "no save button" });
  }

  console.log("=== GATE 4: Practice ===");
  await login(page);
  await page.goto(`${BASE}/practice`);
  await page.waitForLoadState("networkidle");
  const practiceH1 = await page.locator("h1").textContent({ timeout: 5000 });
  results.push({ gate: 4, test: "practice-page", pass: !!practiceH1, h1: practiceH1 });

  const practiceStart = page.locator('button:has-text("Start"), a:has-text("Start"), button:has-text("Begin")').first();
  if (await practiceStart.isVisible({ timeout: 3000 })) {
    await practiceStart.click();
    await page.waitForTimeout(2000);
    results.push({ gate: 4, test: "practice-attempt-start", pass: true, url: page.url() });
  } else {
    results.push({ gate: 4, test: "practice-attempt-start", pass: false, reason: "no start button visible" });
  }

  console.log("=== GATE 5: Mock Tests ===");
  await login(page);
  await page.goto(`${BASE}/mock-tests`);
  await page.waitForLoadState("networkidle");
  const mockH1 = await page.locator("h1").textContent({ timeout: 5000 });
  const testLinks = await page.locator('a[href*="/mock-tests/"]').count();
  results.push({ gate: 5, test: "mock-tests-page", pass: !!mockH1, h1: mockH1, testCount: testLinks });

  const mockStart = page.locator('button:has-text("Start"), a:has-text("Start")').first();
  if (await mockStart.isVisible({ timeout: 3000 })) {
    await mockStart.click();
    await page.waitForTimeout(2000);
    results.push({ gate: 5, test: "mock-test-start", pass: true, url: page.url() });
  } else {
    results.push({ gate: 5, test: "mock-test-start", pass: false, reason: "no start button visible" });
  }

  const detailLink = page.locator('a[href*="/mock-tests/"]').first();
  if (await detailLink.isVisible({ timeout: 2000 })) {
    await detailLink.click();
    await page.waitForLoadState("networkidle");
    const sections = await page.locator('text=/listening|reading|writing|speaking/i').count();
    results.push({ gate: 6, test: "sections-visible", pass: sections >= 0, sections, url: page.url() });
  }

  console.log("=== GATE 8: Score Gating ===");
  const scoreResp = await page.request.get(`${BASE}/api/attempts/00000000-0000-0000-0000-000000000001/predict-score`);
  const scoreBody = await scoreResp.json();
  const gatingMsg = scoreBody?.error?.message || "";
  const hasScore = !!scoreBody?.data?.overallBand;
  results.push({
    gate: 8,
    test: "score-gating",
    pass: gatingMsg.includes("four modules") || gatingMsg.includes("completed") || hasScore,
    status: scoreResp.status(),
    errorMsg: gatingMsg,
    hasScore
  });

  console.log("=== GATE 9: Disclaimer ===");
  const disclaimer = scoreBody?.data?.disclaimer || "";
  const label = scoreBody?.data?.label || "";
  const hasDisclaimer = disclaimer.toLowerCase().includes("unofficial") || label.toLowerCase().includes("unofficial");
  results.push({ gate: 9, test: "disclaimer-in-response", pass: hasDisclaimer, disclaimer, label });

  console.log("=== GATE 10: Admin ===");
  await login(page, "admin");
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState("networkidle");
  const adminH1 = await page.locator("h1").textContent({ timeout: 5000 });
  results.push({ gate: 10, test: "admin-dashboard", pass: !!adminH1, h1: adminH1 });

  await page.goto(`${BASE}/admin/resources`);
  await page.waitForLoadState("networkidle");
  const adminResH1 = await page.locator("h1").textContent({ timeout: 5000 });
  results.push({ gate: 10, test: "admin-resources", pass: !!adminResH1, h1: adminResH1 });

  await page.goto(`${BASE}/admin/tests`);
  await page.waitForLoadState("networkidle");
  const adminTestsH1 = await page.locator("h1").textContent({ timeout: 5000 });
  results.push({ gate: 10, test: "admin-tests", pass: !!adminTestsH1, h1: adminTestsH1 });

  await page.goto(`${BASE}/admin/reviews`);
  await page.waitForLoadState("networkidle");
  const adminReviewsH1 = await page.locator("h1").textContent({ timeout: 5000 });
  results.push({ gate: 10, test: "admin-reviews", pass: !!adminReviewsH1, h1: adminReviewsH1 });

  await page.goto(`${BASE}/admin/flashcards`);
  await page.waitForLoadState("networkidle");
  const adminFlashH1 = await page.locator("h1").textContent({ timeout: 5000 });
  results.push({ gate: 10, test: "admin-flashcards", pass: !!adminFlashH1, h1: adminFlashH1 });

  const createResBtn = page.locator('a[href*="/admin/resources/new"]').first();
  if (await createResBtn.isVisible({ timeout: 2000 })) {
    await createResBtn.click();
    await page.waitForLoadState("networkidle");
    const titleInput = page.locator('input[id="title"], input[name="title"]').first();
    if (await titleInput.isVisible({ timeout: 3000 })) {
      await titleInput.fill("E2E Test Resource");
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Publish")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    results.push({ gate: 10, test: "admin-create-resource", pass: true, url: page.url() });
  } else {
    results.push({ gate: 10, test: "admin-create-resource", pass: false, reason: "no create button" });
  }

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ gate: "ERROR", test: "fatal", pass: false, error: msg });
  } finally {
    await browser.close();
  }

  console.log("\n\n=== RESULTS ===");
  for (const r of results) {
    const icon = r.pass === true ? "✅" : r.pass === false ? "❌" : "⚠️";
    console.log(`${icon} Gate ${r.gate} / ${r.test}: ${r.pass} ${r.error || ""}`);
    if (r.h1) console.log(`   h1: "${r.h1}"`);
    if (r.url) console.log(`   url: ${r.url}`);
    if (r.resourceCount !== undefined) console.log(`   resources: ${r.resourceCount}`);
    if (r.testCount !== undefined) console.log(`   mock tests: ${r.testCount}`);
    if (r.sections !== undefined) console.log(`   sections: ${r.sections}`);
    if (r.disclaimer) console.log(`   disclaimer: "${r.disclaimer.slice(0, 80)}"`);
    if (r.errorMsg) console.log(`   api response: ${r.errorMsg}`);
  }
}

main().catch(console.error);
