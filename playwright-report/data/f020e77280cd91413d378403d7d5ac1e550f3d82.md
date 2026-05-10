# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-guard.spec.ts >> route protection >> logged-out learner route redirects to login with next path
- Location: tests/e2e/auth-guard.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3100/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.describe("route protection", () => {
  4  |   test("logged-out learner route redirects to login with next path", async ({ page }) => {
> 5  |     await page.goto("/dashboard");
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  6  | 
  7  |     await expect(page).toHaveURL(/\/login\?next=\/dashboard/);
  8  |     await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  9  |   });
  10 | 
  11 |   test("logged-out admin route redirects to login with next path", async ({ page }) => {
  12 |     await page.goto("/admin");
  13 | 
  14 |     await expect(page).toHaveURL(/\/login\?next=\/admin/);
  15 |     await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  16 |   });
  17 | });
  18 | 
```