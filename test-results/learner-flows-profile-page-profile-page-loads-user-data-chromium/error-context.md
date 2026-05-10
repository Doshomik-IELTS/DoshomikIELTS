# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learner-flows.spec.ts >> profile page >> profile page loads user data
- Location: tests/e2e/learner-flows.spec.ts:56:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e8]:
    - generic [ref=e9]:
      - link "IELTS++" [ref=e11] [cursor=pointer]:
        - /url: /
        - img [ref=e13]
        - text: IELTS++
      - generic [ref=e16]:
        - generic [ref=e17]:
          - heading "Welcome back" [level=1] [ref=e18]
          - paragraph [ref=e19]: Sign in to continue your IELTS journey
        - generic [ref=e20]:
          - generic [ref=e21]:
            - text: Email
            - generic [ref=e22]:
              - img [ref=e23]
              - textbox "Email" [ref=e26]:
                - /placeholder: you@example.com
                - text: demo@ieltspp.local
          - generic [ref=e27]:
            - text: Password
            - generic [ref=e28]:
              - img [ref=e29]
              - textbox "Password" [ref=e32]:
                - /placeholder: ••••••••
                - text: Test@1234!
          - generic [ref=e33]:
            - generic [ref=e34]:
              - checkbox "Remember me" [ref=e35]
              - generic [ref=e36]: Remember me
            - link "Forgot password?" [ref=e37] [cursor=pointer]:
              - /url: /reset-password
          - button "Signing in..." [disabled]:
            - img
            - text: Signing in...
        - paragraph [ref=e39]:
          - text: Don't have an account?
          - link "Create one" [ref=e40] [cursor=pointer]:
            - /url: /register
        - generic [ref=e41]:
          - paragraph [ref=e42]: Demo account
          - paragraph [ref=e43]: "Email: demo@ieltspp.local"
          - paragraph [ref=e44]: "Password: Test@1234!"
          - paragraph [ref=e45]: Admin demo
          - paragraph [ref=e46]: "Email: admin@ieltspp.local"
          - paragraph [ref=e47]: "Password: Test@1234!"
      - paragraph [ref=e48]:
        - link "← Back to home" [ref=e49] [cursor=pointer]:
          - /url: /
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e55] [cursor=pointer]:
    - img [ref=e56]
  - alert [ref=e59]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { DEV_AUTH } from "../../src/config/dev-auth";
  3  | 
  4  | async function loginAsDemoUser(page: import("@playwright/test").Page) {
  5  |   await page.goto("/login");
  6  |   await page.getByLabel("Email").fill(DEV_AUTH.email);
  7  |   await page.getByLabel("Password").fill(DEV_AUTH.password);
  8  |   await page.getByRole("button", { name: "Sign in" }).click();
> 9  |   await page.waitForURL(/\/dashboard(\/|$|\?)/, { timeout: 10000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  10 | }
  11 | 
  12 | test.describe("learner dashboard", () => {
  13 |   test("dashboard shows user info and navigation links", async ({ page }) => {
  14 |     await loginAsDemoUser(page);
  15 | 
  16 |     await expect(page.getByText(/Welcome back, Demo Learner/i)).toBeVisible();
  17 |     
  18 |     await expect(page.getByRole("link", { name: "Resources", exact: true })).toBeVisible();
  19 |     await expect(page.getByRole("link", { name: "Practice", exact: true })).toBeVisible();
  20 |     await expect(page.getByRole("link", { name: "Mock Tests", exact: true })).toBeVisible();
  21 |     await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
  22 |   });
  23 | });
  24 | 
  25 | test.describe("resources page", () => {
  26 |   test("resources page loads and displays content", async ({ page }) => {
  27 |     await loginAsDemoUser(page);
  28 | 
  29 |     await page.getByRole("link", { name: /Resources/i }).click();
  30 |     await page.waitForURL(/\/resources/);
  31 |     await expect(page.getByRole("heading", { name: /Resources/i })).toBeVisible();
  32 |   });
  33 | });
  34 | 
  35 | test.describe("practice page", () => {
  36 |   test("practice page loads and displays practice options", async ({ page }) => {
  37 |     await loginAsDemoUser(page);
  38 | 
  39 |     await page.getByRole("link", { name: /Practice/i }).click();
  40 |     await page.waitForURL(/\/practice/);
  41 |     await expect(page.getByRole("heading", { name: /Practice/i })).toBeVisible();
  42 |   });
  43 | });
  44 | 
  45 | test.describe("mock tests page", () => {
  46 |   test("mock tests page loads", async ({ page }) => {
  47 |     await loginAsDemoUser(page);
  48 | 
  49 |     await page.getByRole("link", { name: /Mock Tests/i }).click();
  50 |     await page.waitForURL(/\/mock-tests/);
  51 |     await expect(page.getByRole("heading", { name: /Mock Tests/i })).toBeVisible();
  52 |   });
  53 | });
  54 | 
  55 | test.describe("profile page", () => {
  56 |   test("profile page loads user data", async ({ page }) => {
  57 |     await loginAsDemoUser(page);
  58 | 
  59 |     await page.getByRole("link", { name: /Profile/i }).click();
  60 |     await expect(page).toHaveURL(/\/profile/);
  61 |     await expect(page.getByRole("heading", { name: /Profile/i }).first()).toBeVisible();
  62 |   });
  63 | 
  64 | test("profile page has form fields", async ({ page }) => {
  65 |     await loginAsDemoUser(page);
  66 |     
  67 |     await page.getByRole("link", { name: "Profile", exact: true }).click();
  68 |     await page.waitForURL(/\/profile/, { timeout: 15000 });
  69 |     
  70 |     await expect(page.getByLabel("Name")).toBeVisible();
  71 |     await expect(page.getByLabel("Target band")).toBeVisible();
  72 |     await expect(page.getByLabel("Native language")).toBeVisible();
  73 |   });
  74 | });
  75 | 
```