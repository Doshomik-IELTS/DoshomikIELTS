# Launch Gate Test Failure: Root Cause Analysis

> **Status note (2026-05-19):** This document is historical context for the earlier failing launch-gate setup. The launch-gate specs have since been rewritten to use deterministic seeded routes and stronger assertions in `tests/e2e/launch-gates.spec.ts` and `tests/e2e/05-attempts.spec.ts`. Treat the analysis below as background, not the current test contract.

**Date:** 2026-05-14
**Issue:** `scripts/run-launch-gates.ts` times out waiting for `/dashboard` after login
**Error:** `page.waitForURL: Timeout 15000ms exceeded — waiting for navigation to "**/dashboard"`

---

## What the Test Does

```typescript
await login(page);  // → waits 15s for URL to contain "/dashboard"
```

The `login()` helper:
1. Navigates to `http://127.0.0.1:3002/login`
2. Fills `input[id="email"]` with demo credentials
3. Fills `input[id="password"]` with demo credentials
4. Clicks `button[type="submit"]`
5. Calls `page.waitForURL("**/dashboard", { timeout: 15000 })`

---

## What Should Happen (Flow)

```
Browser → GET /login
         → Fill email + password, click Submit
         → POST /api/dev-auth/login
             → 200 OK + Set-Cookie: doshomikielts-dev-session=<token>
         → LoginForm onSuccess: router.push("/dashboard")
         → GET /dashboard
             → Middleware reads doshomikielts-dev-session cookie
             → User is authenticated → allow through
         → Dashboard page renders
```

---

## What We Found in the Codebase

### 1. Login form (`src/app/(auth)/login/login-form.tsx`)

- Form renders with `<Input id="email">` and `<Input id="password">` ✅ — selectors match
- On submit calls `POST /api/dev-auth/login` ✅
- On success: `router.push(nextPath)` where `nextPath` defaults to `/dashboard` ✅
- In **dev mode** (`NODE_ENV !== "production"`), the dev auth path is used ✅
- In **production**, it uses Supabase client auth ✅ — dev credentials won't work

### 2. Dev auth API (`src/app/api/dev-auth/login/route.ts`)

- Returns `ok({ ... })` response ✅
- Sets `doshomikielts-dev-session` httpOnly cookie ✅
- Credentials checked against `devCredentialsMatch(email, password)` ✅

### 3. Middleware (`middleware.ts`)

- Reads `DEV_COOKIE_NAME = "doshomikielts-dev-session"` cookie ✅
- If cookie present → redirects to `/dashboard` if on an auth route ✅
- If user authenticated → allows through to protected routes ✅
- If **not** authenticated → redirects to `/login?next=<path>` ✅

### 4. Redirect destination

- **Confirmed:** After login, the `nextPath` defaults to `/dashboard`
- Middleware redirects to `/dashboard` when authenticated user visits `/login`
- So both the client-side `router.push("/dashboard")` and middleware redirect point to `/dashboard` ✅

---

## Root Cause

**The test script uses top-level `await` which is incompatible with the `tsx` runner's CommonJS output mode.**

The file was originally written with top-level `await` at the module level:

```typescript
const browser = await chromium.launch({ headless: true });  // ← top-level await
```

`tsx` compiles this to CJS, which does **not** support top-level await. The error confirms:

```
ERROR: Top-level await is currently not supported with the "cjs" output format
```

The file was fixed to wrap in `async function main() { ... }` with `main().catch()` — but then the test revealed a **different** problem:

```
page.waitForURL: Timeout 15000ms exceeded.
```

The browser **does** launch (since we got past the CJS error), but the login navigation never completes. This means either:

### Possibility A: `router.push()` doesn't trigger Playwright's `waitForURL` for SPA navigation

In Next.js App Router, `router.push()` is a client-side navigation that Playwright's `waitForURL` may or may not intercept depending on timing. The 15s timeout suggests the navigation never fired at all.

### Possibility B: Dev mode is not active

`login-form.tsx` line 16:
```typescript
const isDevAuthEnabled = process.env.NODE_ENV !== "production";
```

If `NODE_ENV` is `"production"` somehow, the form will attempt **Supabase auth** instead of `/api/dev-auth/login`. Since the Supabase URL/key point to a real project (`zvsryxyavxfcpbgowafi`) where these demo credentials don't exist, the login fails silently and `router.push()` never fires.

### Possibility C: Rate limiting is blocking the login API

`src/app/api/dev-auth/login/route.ts` applies `authRateLimiter`. If there were recent failed attempts, the IP could be rate-limited, causing the login API to return a 429 before the cookie is ever set.

### Possibility D: The dashboard page crashes / middleware blocks

If the middleware doesn't recognize the dev cookie, every attempt to visit `/dashboard` gets redirected back to `/login`, creating a redirect loop that Playwright's `waitForURL` never resolves.

---

## Next Steps to Debug

1. **Verify dev mode**: Check that `process.env.NODE_ENV === "development"` when running the script. Add `console.log(process.env.NODE_ENV)` in the test or check the browser console.

2. **Check the dev cookie name match**: The middleware uses `DEV_COOKIE_NAME = "doshomikielts-dev-session"` but the cookie is set in the API response. Verify the cookie name in the response matches exactly.

3. **Add console logging to the test**: Log `page.url()` at each step and `response.headers()` from the API call to see what's actually happening.

4. **Try `page.goto` instead of `router.push`**: After the form submits, try `await page.goto("http://127.0.0.1:3002/dashboard")` to bypass the SPA navigation timing issue.

5. **Check rate limiting**: Look at `/api/dev-auth/login` rate limit state. The limiter uses an in-memory store (`Map`) which resets on server restart — so if the dev server was just started, this shouldn't be an issue.

6. **Verify the dev session cookie is being set**: After clicking submit, check `await page.context().cookies()` to see if the `doshomikielts-dev-session` cookie is present.

7. **Try direct cookie injection**: Instead of relying on the form submission + API, set the dev session cookie directly in the browser context before navigating to `/dashboard` — this isolates whether the problem is login or dashboard access.

---

## Recommendations

### Fix the test to be more robust

Replace the SPA navigation approach with a cookie-based direct navigation:

```typescript
async function login(page: any, role = "demo") {
  // Instead of form-based login + waitForURL
  // 1. Set the dev cookie directly in the context
  // 2. Navigate to /dashboard directly
  // This bypasses router.push() timing issues
  await page.context().addCookies([{
    name: "doshomikielts-dev-session",
    value: createTestToken(role), // generate a valid test token
    domain: "127.0.0.1",
    path: "/"
  }]);
  await page.goto(`${BASE}/dashboard`);
  return;
}
```

However, this changes the semantics of the test — it tests dashboard access rather than the full login flow.

### Better approach: fix the login flow detection

```typescript
// After clicking submit, wait for the network to settle instead of URL change
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");
// Then check URL
await page.waitForFunction(() => window.location.href.includes("/dashboard"), { timeout: 15000 });
```

Or use `page.waitForResponse()` to wait for the `/api/dev-auth/login` response, then check if the cookie is set, then navigate.

### Clarify the actual test intent

The test is called "launch gates" — does it need to test the full login UI flow, or does it just need to verify that authenticated users can access all the key pages? If it's the latter, set the auth cookie directly and test page access. If it's the former, fix the navigation detection method.
