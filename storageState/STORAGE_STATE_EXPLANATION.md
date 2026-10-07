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

```text
navigate → click My Account → click Login → fill email → fill password → click Login button
```

For 10 tests that is **10 full login round-trips** — slow and fragile.

---

## 2. The Solution — storageState

```text
globalSetup runs ONCE
        ↓
saves cookies + localStorage
        ↓
.playwright/auth.json
        ↓
tests load this saved state
        ↓
tests start already logged in
```

No repeated UI login.

---

## 3. How globalSetup.ts Works

```text
playwright.config.ts registers it
        ↓
Playwright runs globalSetup ONCE before any test
        ↓
chromium.launch() → new page (no baseURL context)
        ↓
page.goto(`${baseURL}/opencart`) ← full absolute URL required here
        ↓
HomePage.clickLoginPage()
        ↓
LoginPage.performLogin(email, password)
        ↓
page.waitForLoadState('networkidle')
        ↓
page.context().storageState({ path: '.playwright/auth.json' })
        ↓
browser.close()
```

### Why `waitForLoadState('networkidle')` instead of `waitForURL()`?

`waitForURL()` listens for a **future** navigation event. By the time it is called,
the login redirect may already have completed, so it can wait for an event that
already happened.

`waitForLoadState('networkidle')` checks the current page loading state and waits
until network activity has settled.

---

### Why `config.projects[0].use.baseURL`?

`FullConfig` does not have a top-level `use` property.

Playwright resolves the configuration into individual projects, so the root-level
`use` settings are available through:

```ts
config.projects[0].use.baseURL
```

at runtime.

---

## 4. Ways to Consume storageState in Tests

Once `globalSetup.ts` creates `.playwright/auth.json`, there are **three primary
configuration levels** for consuming storage state.

### Option A: Global Configuration

Set `storageState` inside the main `use` object in `playwright.config.ts`.

This applies to **all tests** in the project.

```ts
export default defineConfig({
    use: {
        storageState: '.playwright/auth.json',
    },
});
```

This is the simplest choice when the whole test suite uses the same logged-in user.

---

### Option B: Per File / Describe Block — `test.use()`

Use `test.use()` inside a test file.

It applies only to that file, or to a specific `test.describe` block.

```ts
import { test, expect } from '@playwright/test';

test.use({
    storageState: '.playwright/auth.json'
});

test('My Account page title is correct', async ({ page }) => {
    // page is already logged in
});
```

You can also switch storage state for different `describe` blocks:

```ts
test.describe('Admin tests', () => {
    test.use({
        storageState: '.playwright/admin.json'
    });

    // tests...
});

test.describe('Customer tests', () => {
    test.use({
        storageState: '.playwright/customer.json'
    });

    // tests...
});
```

**Advantages:**
- No custom fixture required.
- Uses Playwright's built-in `{ page }` fixture.
- Easy to switch between different authentication states.
- Can also test an unauthenticated state:

```ts
test.use({
    storageState: {
        cookies: [],
        origins: []
    }
});
```

---

### Option C: Per Project

Set `storageState` inside the `projects` array in `playwright.config.ts`.

This is useful for **multi-role / matrix testing**, where the same tests need
to run as different users.

```ts
export default defineConfig({
    projects: [
        {
            name: 'admin',
            use: {
                storageState: '.playwright/admin.json'
            }
        },
        {
            name: 'customer',
            use: {
                storageState: '.playwright/customer.json'
            }
        }
    ]
});
```

The same test suite can then run with different saved sessions.

---

## 5. Custom Fixture — `storageStateFixture.ts`

A custom fixture can encapsulate both loading the saved state and navigating to
the required page.

```ts
base.extend<{ myAccountPage: MyAccountPage }>({
    myAccountPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: '.playwright/auth.json'
        });

        const page = await context.newPage();

        await page.goto(
            '/opencart/index.php?route=account/account'
        );

        const myAccountPage = new MyAccountPage(page);

        await use(myAccountPage);

        await context.close();
    }
});
```

### Why `{ browser }` instead of `{ page }`?

The built-in `{ page }` fixture already comes from a Playwright-managed context.

Here, the custom fixture needs to create its **own browser context** with:

```ts
browser.newContext({
    storageState: '.playwright/auth.json'
});
```

Therefore it uses `{ browser }`.

---

## 6. Difference Between the Two Fixtures

| | `loginFixture.ts` | `storageStateFixture.ts` |
|---|---|---|
| Location | `fixtures/` | `fixtures/` |
| Login method | Full UI login before every test | Loads saved session |
| Speed | Slower | Faster |
| Fixture arg | `{ page }` | `{ browser }` |
| Requires `globalSetup` | No | Yes |
| Requires `auth.json` | No | Yes |
| UI login during test setup | Yes | No |

---

## 7. Registration in `playwright.config.ts`

To generate the authentication state using `globalSetup`:

```ts
export default defineConfig({
    globalSetup: './storageState/globalSetup.ts',

    use: {
        storageState: '.playwright/auth.json',
        baseURL: 'https://naveenautomationlabs.com/'
    }
});
```

The important distinction is:

```text
globalSetup
    ↓
CREATES auth.json

storageState
    ↓
CONSUMES auth.json
```

`globalSetup` is therefore **not a way to consume storage state**. It is the
one-time setup that creates the saved authentication state.

---

## 8. The `.playwright/` Directory

The saved session is written to:

```text
.playwright/auth.json
```

Create the directory if required:

```powershell
New-Item -ItemType Directory -Force -Path '.playwright'
```

Add the authentication file to `.gitignore`:

```gitignore
.playwright/auth.json
```

The file contains live authentication information such as cookies and should
**not be committed to source control**.

---

## 9. Setup Project — Modern Alternative to `globalSetup`

Playwright recommends **Setup Projects with project dependencies** as a modern
approach for authentication setup.

The concept remains the same:

```text
Setup Project
      ↓
Login once
      ↓
Create auth.json
      ↓
Test Projects depend on Setup Project
      ↓
Tests consume storageState
```

The advantage is that authentication setup becomes part of Playwright's project
model and integrates better with Playwright's test reporting, traces, and UI.

---

## 10. Complete Flow

```text
                    playwright.config.ts
                           │
                           ▼
              globalSetup / Setup Project
                           │
                           ▼
                  Login through UI
                           │
                           ▼
              .playwright/auth.json
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       Global use      test.use()    Project use
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    Tests consume
                     saved session
                           │
                           ▼
                  Tests start logged in
```

## Key Takeaway

```text
globalSetup / Setup Project
        =
CREATE authentication state

storageState
        =
CONSUME authentication state
```

And `storageState` can be configured at three levels:

```text
1. Global      → playwright.config.ts → use
2. Per test    → test.use()
3. Per project → projects[].use
```
