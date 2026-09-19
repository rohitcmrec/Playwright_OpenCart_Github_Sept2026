# storageState — Folder Guide

This folder contains everything related to **storageState-based authentication** in Playwright.

---

## Folder Contents

| File | Purpose |
|------|---------|
| `globalSetup.ts` | Runs **once** before the whole test suite. Logs in via the UI and saves the session to `.playwright/auth.json`. |
| `STORAGE_STATE_EXPLANATION.md` | This file — explains the full concept. |

> **`storageStateFixture.ts`** lives in `fixtures/` (alongside `loginFixture.ts`) because it is a custom Playwright fixture — it belongs with all other fixtures, not here.

---

## 1. The Problem Being Solved

Without storageState, every test must log in through the UI:

```
navigate → click My Account → click Login → fill email → fill password → click Login button
```

For 10 tests that is **10 full login round-trips** — slow and fragile.

---

## 2. The Solution — storageState

```
globalSetup runs ONCE → saves cookies + localStorage → .playwright/auth.json
                                                               ↓
                                              every test loads this file
                                              and starts already logged in
```

No repeated UI login. Tests start instantly on the My Account page.

---

## 3. How globalSetup.ts Works

```
playwright.config.ts registers it
        ↓
Playwright runs globalSetup ONCE before any test
        ↓
chromium.launch() → new page (no baseURL context)
        ↓
page.goto(`${baseURL}/opencart`)        ← full absolute URL required here
        ↓
HomePage.clickLoginPage()               ← reuses existing page objects
        ↓
LoginPage.performLogin(email, password)
        ↓
page.waitForLoadState('networkidle')    ← wait for redirect to complete
        ↓
page.context().storageState({ path: '.playwright/auth.json' })
        ↓
browser.close()
```

### Why `waitForLoadState('networkidle')` instead of `waitForURL()`?

`waitForURL()` listens for a **future** navigation event. By the time it is called,
the login redirect has already completed, so it times out waiting for an event that
already happened. `waitForLoadState('networkidle')` checks the **current** state of
the page, so it resolves immediately if the page has already settled.

### Why `config.projects[0].use.baseURL`?

`FullConfig` (the type Playwright passes to globalSetup) has no top-level `use` property.
However, Playwright **merges** the root-level `use` from `playwright.config.ts` into every
resolved `FullProject.use` before globalSetup runs. So even though `baseURL` is defined at
the root level in the config, it is accessible via `config.projects[0].use.baseURL` at runtime.

---

## 4. Ways to Consume storageState in Tests

Once `globalSetup.ts` creates `.playwright/auth.json`, there are **two ways** to use it in your test files:

### Option A: Direct `test.use()` (Simplest & Built-in Playwright Approach) ⭐

You do not need any custom fixture file. Import standard `test` from `@playwright/test` and call `test.use({ storageState: '...' })` directly in your test file:

```ts
// tests/myAccountPage.testUse.spec.ts
import { test, expect } from '@playwright/test';
import { MyAccountPage } from '../pages/MyAccountPage';

// Tell Playwright to inject the auth state into the built-in { page } fixture
test.use({ storageState: '.playwright/auth.json' });

test('My Account page title is correct', async ({ page }) => {
    const myAccountPage = new MyAccountPage(page);
    await page.goto('/opencart/index.php?route=account/account');

    const title = await myAccountPage.getMyAccountPageTitle();
    expect(title).toBe('My Account');
});
```

**Why this is great:**
- **Zero fixture boilerplate** — uses Playwright's native `{ page }`.
- **Easy role switching** — you can use `test.use({ storageState: 'admin.json' })` or `test.use({ storageState: 'customer.json' })` inside different `test.describe` blocks.
- **Can reset auth** — easily test unauthenticated state with `test.use({ storageState: { cookies: [], origins: [] } })`.

---

### Option B: Custom Fixture (`storageStateFixture.ts`)

Encapsulates both context creation and initial navigation inside a reusable fixture `{ myAccountPage }`:

```ts
// fixtures/storageStateFixture.ts
base.extend<{ myAccountPage: MyAccountPage }>({
    myAccountPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: '.playwright/auth.json'   // ← load saved session
        });
        const page = await context.newPage();
        await page.goto('/opencart/index.php?route=account/account');
        const myAccountPage = new MyAccountPage(page);
        await use(myAccountPage);       // ← hand to the test
        await context.close();          // ← teardown
    }
})
```

Key points:
- Uses `{ browser }` (not `{ page }`) so it can create its own context with the saved storageState.
- Navigates directly to the My Account page — no login UI involved.
- `context.close()` after `use()` cleans up after every test automatically.

---

## 5. Difference vs loginFixture.ts

| | `loginFixture.ts` | `storageStateFixture.ts` |
|---|---|---|
| **Location** | `fixtures/` | `storageState/` |
| **Login method** | Full UI login before every test | Loads saved session once |
| **Speed** | Slower (UI round-trip per test) | Faster (no UI login) |
| **Fixture arg** | `{ page }` | `{ browser }` |
| **Requires globalSetup** | No | Yes |
| **auth.json needed** | No | Yes — written by `globalSetup.ts` |

---

## 6. Registration in playwright.config.ts

```ts
export default defineConfig({
    globalSetup: './storageState/globalSetup.ts',   // ← triggers the one-time login
    ...
});
```

Without this line, `globalSetup.ts` never runs, `auth.json` is never created,
and the fixture crashes with `ENOENT: no such file or directory`.

---

## 7. The .playwright/ Directory

The saved session is written to `.playwright/auth.json`. This directory must exist
before `globalSetup` runs. It is created once:

```
New-Item -ItemType Directory -Force -Path '.playwright'
```

Add `.playwright/auth.json` to `.gitignore` — it contains live session cookies
and must not be committed to source control.

---

## 8. Flow Diagram

```
playwright.config.ts
│
├─ globalSetup: './storageState/globalSetup.ts'
│       │
│       └─ runs ONCE → writes .playwright/auth.json
│
├─ Option A: tests/myAccountPage.testUse.spec.ts
│       │
│       └─ test.use({ storageState: '.playwright/auth.json' })
│               │
│               └─ built-in { page } is already logged in ✓
│
└─ Option B: tests/myAccountPage.storageState.spec.ts
        │
        └─ imports storageState/storageStateFixture.ts
                │
                └─ custom fixture creates newContext with storageState ✓
```
