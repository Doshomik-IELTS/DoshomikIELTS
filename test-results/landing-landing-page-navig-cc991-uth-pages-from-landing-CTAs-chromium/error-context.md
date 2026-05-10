# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> landing page >> navigates to auth pages from landing CTAs
- Location: tests/e2e/landing.spec.ts:26:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "I+ IELTS++" [ref=e5] [cursor=pointer]:
          - /url: /
          - generic [ref=e6]: I+
          - text: IELTS++
        - navigation [ref=e7]:
          - link "Features" [ref=e8] [cursor=pointer]:
            - /url: "#features"
          - link "Modules" [ref=e9] [cursor=pointer]:
            - /url: "#modules"
          - link "How it works" [ref=e10] [cursor=pointer]:
            - /url: "#how-it-works"
        - generic [ref=e11]:
          - link "Login" [ref=e12] [cursor=pointer]:
            - /url: /login
          - link "Get started" [ref=e13] [cursor=pointer]:
            - /url: /register
            - button "Get started" [ref=e14]
    - main [ref=e15]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - img [ref=e21]
            - text: Basic English to IELTS readiness
          - heading "Build foundations, practise smarter, and complete IELTS-style mock tests." [level=1] [ref=e24]
          - paragraph [ref=e25]: IELTS++ helps learners move from Basic English to IELTS preparation with owned resources, original practice, transparent feedback, and score prediction after a complete test attempt.
          - generic [ref=e26]:
            - link "Start learning" [ref=e27] [cursor=pointer]:
              - /url: /register
              - button "Start learning" [active] [ref=e28]:
                - text: Start learning
                - img [ref=e29]
            - link "Explore resources" [ref=e31] [cursor=pointer]:
              - /url: /resources
              - button "Explore resources" [ref=e32]
          - generic [ref=e33]:
            - generic [ref=e34]:
              - img [ref=e35]
              - text: Foundation lessons
            - generic [ref=e38]:
              - img [ref=e39]
              - text: Full mock flow
            - generic [ref=e42]:
              - img [ref=e43]
              - text: Unofficial band prediction
        - generic [ref=e46]:
          - generic [ref=e48]:
            - generic [ref=e49]:
              - paragraph [ref=e50]: Learner journey
              - heading "From basics to band estimate" [level=3] [ref=e51]
            - img [ref=e52]
          - list [ref=e57]:
            - listitem [ref=e58]:
              - generic [ref=e59]: "1"
              - generic [ref=e60]: Set your target band and exam date.
            - listitem [ref=e61]:
              - generic [ref=e62]: "2"
              - generic [ref=e63]: Study foundation lessons and save key resources.
            - listitem [ref=e64]:
              - generic [ref=e65]: "3"
              - generic [ref=e66]: Practise focused vocabulary, grammar, Reading, and Listening drills.
            - listitem [ref=e67]:
              - generic [ref=e68]: "4"
              - generic [ref=e69]: Complete Writing and Speaking responses for AI-assisted feedback.
            - listitem [ref=e70]:
              - generic [ref=e71]: "5"
              - generic [ref=e72]: Finish all four modules in a mock test to unlock an unofficial score prediction.
      - generic [ref=e73]:
        - generic [ref=e74]:
          - paragraph [ref=e75]: MVP features
          - heading "Everything needed for a complete IELTS practice loop." [level=2] [ref=e76]
          - paragraph [ref=e77]: The MVP connects learning resources, focused practice, mock tests, evaluation, and progress tracking.
        - generic [ref=e78]:
          - generic [ref=e79]:
            - generic [ref=e80]:
              - img [ref=e81]
              - heading "Basic-English-to-IELTS path" [level=3] [ref=e84]
            - generic [ref=e85]: Start with sentence structure, parts of speech, grammar rules, vocabulary, synonyms, and common errors before attempting full mock tests.
          - generic [ref=e86]:
            - generic [ref=e87]:
              - img [ref=e88]
              - heading "Owned resource library" [level=3] [ref=e90]
            - generic [ref=e91]: Text-based resources for Basic English, words, synonyms, grammar, Reading, Listening, Writing, and Speaking strategies.
          - generic [ref=e92]:
            - generic [ref=e93]:
              - img [ref=e94]
              - heading "Objective practice scoring" [level=3] [ref=e98]
            - generic [ref=e99]: Reading, Listening, vocabulary, synonym, and grammar practice can be marked instantly with explanations and accepted answer variants.
          - generic [ref=e100]:
            - generic [ref=e101]:
              - img [ref=e102]
              - heading "Transparent AI feedback" [level=3] [ref=e114]
            - generic [ref=e115]: Writing and Speaking feedback includes criterion-level band estimates, strengths, weaknesses, improved examples, and a next task.
          - generic [ref=e116]:
            - generic [ref=e117]:
              - img [ref=e118]
              - heading "Progress dashboard" [level=3] [ref=e120]
            - generic [ref=e121]: Track module progress, recent attempts, saved resources, estimated bands, and score history from one learner dashboard.
          - generic [ref=e122]:
            - generic [ref=e123]:
              - img [ref=e124]
              - heading "Copyright-safe content" [level=3] [ref=e127]
            - generic [ref=e128]: The platform is designed for original, licensed, public-domain-valid, or internally reviewed generated content only.
      - generic [ref=e131]:
        - generic [ref=e132]:
          - paragraph [ref=e133]: Four modules
          - heading "Practise each IELTS skill, then combine them in a mock test." [level=2] [ref=e134]
          - paragraph [ref=e135]: Reading and Listening are scored objectively. Writing and Speaking are evaluated with rubric-based feedback.
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]:
              - img [ref=e139]
              - heading "Listening" [level=3] [ref=e141]
            - generic [ref=e142]: Original audio, transcripts, objective answers, accepted variants, and instant estimated band scoring.
          - generic [ref=e143]:
            - generic [ref=e144]:
              - img [ref=e145]
              - heading "Reading" [level=3] [ref=e147]
            - generic [ref=e148]: IELTS-style passages, question sets, answer explanations, and source-span rationale for each item.
          - generic [ref=e149]:
            - generic [ref=e150]:
              - img [ref=e151]
              - heading "Writing" [level=3] [ref=e153]
            - generic [ref=e154]: Task 1 and Task 2 responses evaluated against IELTS-style criteria with practical improvement suggestions.
          - generic [ref=e155]:
            - generic [ref=e156]:
              - img [ref=e157]
              - heading "Speaking" [level=3] [ref=e160]
            - generic [ref=e161]: Part 1, Part 2, and Part 3 practice with text or audio response paths and feedback after evaluation.
      - generic [ref=e163]:
        - generic [ref=e164]:
          - paragraph [ref=e165]: Transparent scoring
          - heading "Score prediction only after a complete four-module attempt." [level=2] [ref=e166]
          - paragraph [ref=e167]: IELTS++ avoids overclaiming. Learners see module progress first, then an unofficial overall estimate only when Listening, Reading, Writing, and Speaking are complete.
          - generic [ref=e168]:
            - generic [ref=e169]:
              - img [ref=e170]
              - generic [ref=e174]: No Cambridge IELTS PDFs, scans, copied passages, copied questions, or copyrighted audio.
            - generic [ref=e175]:
              - img [ref=e176]
              - generic [ref=e180]: Answer keys stay hidden from learner-facing test screens.
            - generic [ref=e181]:
              - img [ref=e182]
              - generic [ref=e186]: Scores are clearly labelled as unofficial practice estimates.
            - generic [ref=e187]:
              - img [ref=e188]
              - generic [ref=e192]: Private speaking recordings use protected storage and signed URL flows.
        - generic [ref=e193]:
          - generic [ref=e194]:
            - paragraph [ref=e195]: Example score card
            - heading "Unofficial prediction" [level=3] [ref=e196]
          - generic [ref=e197]:
            - generic [ref=e198]:
              - generic [ref=e199]:
                - generic [ref=e200]: Listening
                - generic [ref=e201]: Band 6.5
              - generic [ref=e202]:
                - generic [ref=e203]: Reading
                - generic [ref=e204]: Band 6.0
              - generic [ref=e205]:
                - generic [ref=e206]: Writing
                - generic [ref=e207]: Band 6.0
              - generic [ref=e208]:
                - generic [ref=e209]: Speaking
                - generic [ref=e210]: Band 6.5
            - generic [ref=e211]:
              - generic [ref=e212]:
                - generic [ref=e213]: Overall estimate
                - generic [ref=e214]: "6.5"
              - paragraph [ref=e215]: This is an unofficial IELTS band estimate for practice only. It is not an official IELTS result.
      - generic [ref=e217]:
        - generic [ref=e218]:
          - heading "Ready to start building IELTS readiness?" [level=2] [ref=e219]
          - paragraph [ref=e220]: Create a profile, study foundation resources, practise each module, and track your progress toward your target band.
        - link "Create free account" [ref=e221] [cursor=pointer]:
          - /url: /register
          - button "Create free account" [ref=e222]:
            - text: Create free account
            - img [ref=e223]
    - contentinfo [ref=e225]:
      - generic [ref=e226]:
        - paragraph [ref=e227]: © 2026 IELTS++. Practice estimates only.
        - paragraph [ref=e228]: Original and licensed content only. No copied IELTS book material.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e234] [cursor=pointer]:
    - generic [ref=e237]:
      - text: Rendering
      - generic [ref=e238]:
        - generic [ref=e239]: .
        - generic [ref=e240]: .
        - generic [ref=e241]: .
  - alert [ref=e242]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.describe("landing page", () => {
  4  |   test("renders the IELTS++ landing page and primary sections", async ({ page }) => {
  5  |     await page.goto("/");
  6  | 
  7  |     await expect(
  8  |       page.getByRole("heading", {
  9  |         name: /Build foundations, practise smarter, and complete IELTS-style mock tests/i,
  10 |       }),
  11 |     ).toBeVisible();
  12 | 
  13 |     await expect(page.getByRole("link", { name: /Get started/i }).first()).toBeVisible();
  14 |     await expect(page.getByRole("link", { name: /Login/i })).toBeVisible();
  15 | 
  16 |     await expect(page.getByRole("heading", { name: /Everything needed for a complete IELTS practice loop/i })).toBeVisible();
  17 |     await expect(page.getByRole("heading", { name: "Listening" })).toBeVisible();
  18 |     await expect(page.getByRole("heading", { name: "Reading" })).toBeVisible();
  19 |     await expect(page.getByRole("heading", { name: "Writing" })).toBeVisible();
  20 |     await expect(page.getByRole("heading", { name: "Speaking" })).toBeVisible();
  21 | 
  22 |     await expect(page.getByText(/unofficial IELTS band estimate/i)).toBeVisible();
  23 |     await expect(page.getByText(/No copied IELTS book material/i)).toBeVisible();
  24 |   });
  25 | 
  26 |   test("navigates to auth pages from landing CTAs", async ({ page }) => {
  27 |     await page.goto("/");
  28 | 
  29 |     await page.getByRole("link", { name: /Start learning/i }).click();
> 30 |     await page.waitForURL(/\/register/, { timeout: 10000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  31 |     await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  32 | 
  33 |     await page.goto("/");
  34 |     await page.getByRole("link", { name: /Login/i }).click();
  35 |     await page.waitForURL(/\/login/, { timeout: 10000 });
  36 |     await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  37 |   });
  38 | });
  39 | 
```