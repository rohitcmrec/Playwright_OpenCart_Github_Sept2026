# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
TypeScript + Playwright Test against OpenCart at `https://naveenautomationlabs.com/opencart`. No build step — tests run directly via `npx playwright test`. No linter configured.

## Commands

```bash
# Run all tests
npx playwright test

# Run a single test file
npx playwright test tests/loginPage.spec.ts

# Run a single test by title
npx playwright test --grep "perform login"

# Run in a specific browser
npx playwright test --project=chromium

# Run headed (visible browser)
npx playwright test --headed

# View HTML report
npx playwright show-report
```

**No npm scripts exist** — `package.json` has an empty `scripts: {}`. Always use `npx playwright test` directly.

## Project Structure

```
pages/          # Page Object classes (HomePage, LoginPage, MyAccountPage, RegisterPage)
tests/          # Spec files (*.spec.ts)
fixtures/       # Custom test fixtures (loginFixture.ts, storageStateFixture.ts)
storageState/   # globalSetup.ts — runs once, writes .playwright/auth.json
utils/          # DataProvider class (JSON, CSV, XLSX readers)
test-data/      # Test data files
.playwright/    # auth.json lives here (gitignored, created by globalSetup)
```

## Authentication Patterns

Three approaches exist — pick the right one:

| Pattern | File | When to use |
|---|---|---|
| UI login each test | `fixtures/loginFixture.ts` | Tests that must exercise the login flow |
| `test.use(storageState)` | in-spec, no fixture | Simplest pre-auth; easy role switching |
| Custom fixture with `{ browser }` | `fixtures/storageStateFixture.ts` | Pre-auth + automatic navigation + teardown |

- `globalSetup: './storageState/globalSetup.ts'` is already registered in `playwright.config.ts` — it runs once before the suite and writes `.playwright/auth.json`.
- `storageStateFixture` uses `{ browser }` (not `{ page }`) to create its own context with the saved session.
- In `globalSetup`, `baseURL` is read from `config.projects[0].use.baseURL` — there is no top-level `use` on `FullConfig`.
- `waitForLoadState('networkidle')` is used after login (not `waitForURL`) because the redirect has already completed by the time the call is made.

## Page Object Conventions

- All locators are `private readonly` properties defined in the constructor.
- Page methods that navigate to a new page **return a new page object** (chained factory pattern):  
  `clickLoginPage(): Promise<LoginPage>` → `performLogin(...): Promise<MyAccountPage>`
- Page objects store `private readonly page: Page` (not exposed publicly).
- Import page classes using bare module paths (e.g. `import { HomePage } from 'pages/HomePage'`), resolved via `tsconfig.json` `paths: { "*": ["./*"] }`.

## DataProvider

`utils/dataProvider.ts` — `DataProvider` class with three methods:
- `getDataFromJson(filePath)` — path relative to `utils/` (resolved with `__dirname`).
- `getDataFromCSV(filePath)` — returns array of objects (`columns: true`).
- `getDataFromXlsx(filePath, sheetIndex)` — returns sheet as JSON array.

## Key Config Facts

- `baseURL` is `https://naveenautomationlabs.com` — navigate with `/opencart/` or `/opencart/index.php?route=...`.
- `headless: true` by default; `fullyParallel: true`; no retries locally.
- `moduleResolution: "bundler"` in tsconfig — bare imports like `'pages/HomePage'` work without `./` prefix.
- `"type": "commonjs"` in `package.json` — use `require`-compatible patterns when needed.
