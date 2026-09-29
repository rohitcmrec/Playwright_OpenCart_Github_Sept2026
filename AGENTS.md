# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
TypeScript + Playwright Test against OpenCart at `https://naveenautomationlabs.com/opencart`. No build step — tests run directly via `npx playwright test`. No linter configured.

## Commands

```bash
# Run all tests
npx playwright test

# Run a single test file
npx playwright test tests/ui/loginPage.spec.ts

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
tests/
  ui/           # UI spec files (homePage, loginPage, registerPage, myAccountPage variants)
  api/          # API spec files (test1.spec.ts, mockApiTest.spec.ts)
fixtures/       # Custom test fixtures (loginFixture, storageStateFixture, mockApiFixture)
storageState/   # combinedSetup.ts (globalSetup + roleSetup) — runs once before suite
api/            # ApiHelper (real HTTP) and MockApiHelper (page.route() mocking)
utils/          # DataProvider class (JSON, CSV, XLSX readers)
test-data/      # Test data files (JSON, CSV, XLSX)
.playwright/    # auth.json and role session files (gitignored, created by globalSetup)
```

## Authentication Patterns

Three approaches exist — pick the right one:

| Pattern | File | When to use |
|---|---|---|
| UI login each test | `fixtures/loginFixture.ts` | Tests that must exercise the login flow |
| `test.use(storageState)` | in-spec, no fixture | Simplest pre-auth; easy role switching |
| Custom fixture with `{ browser }` | `fixtures/storageStateFixture.ts` | Pre-auth + automatic navigation + teardown |

- `globalSetup: './storageState/combinedSetup.ts'` is registered in `playwright.config.ts` — it runs `globalSetup` (writes `.playwright/auth.json`) and `roleSetup` (writes per-role session files) once before the suite.
- `storageStateFixture` uses `{ browser }` (not `{ page }`) to create its own context with the saved session.
- In `globalSetup`, `baseURL` is read from `config.projects[0].use.baseURL` — there is no top-level `use` on `FullConfig`.
- `waitForLoadState('networkidle')` is used after login (not `waitForURL`) because the redirect has already completed by the time the call is made.

## Page Object Conventions

- All locators are `private readonly` properties defined in the constructor.
- Page methods that navigate to a new page **return a new page object** (chained factory pattern):  
  `clickLoginPage(): Promise<LoginPage>` → `performLogin(...): Promise<MyAccountPage>`
- Page objects store `private readonly page: Page` (not exposed publicly).
- Import page classes using bare module paths (e.g. `import { HomePage } from 'pages/HomePage'`), resolved via `tsconfig.json` `paths: { "*": ["./*"] }`.

## API Testing

### Real HTTP requests — `ApiHelper`
`api/ApiHelper.ts` wraps `APIRequestContext` for real HTTP calls. Instantiate it with a base URL and call `.getRequest(endpoint, headers?)`. Returns `{ status, body }`.

```typescript
const api = new ApiHelper(request, 'https://restful-booker.herokuapp.com')
const { status, body } = await api.getRequest('/booking')
```

### Browser-intercepted mocks — `MockApiHelper`
`api/MockApiHelper.ts` wraps `page.route()` to mock requests fired **through the browser** (page.goto, page.evaluate fetch, XHR from a loaded page). It does **not** intercept raw `APIRequestContext` calls.

```typescript
await mockApi.mockResponse('GET', '**/api/posts/1', {
    status: 200,
    body: { id: 1, title: 'mocked title' }
})
await mockApi.clearMock('**/api/posts/1')  // remove one
await mockApi.clearAllMocks()              // remove all (called automatically by fixture)
```

Use `fixtures/mockApiFixture.ts` to inject `mockApi` into tests — teardown is automatic.

## DataProvider

`utils/dataProvider.ts` — `DataProvider` class with three methods:
- `getDataFromJson(filePath)` — path relative to `utils/` (resolved with `__dirname`).
- `getDataFromCSV(filePath)` — returns array of objects (`columns: true`).
- `getDataFromXlsx(filePath, sheetIndex)` — returns sheet as JSON array.

## Key Config Facts

- `baseURL` is `https://naveenautomationlabs.com` — navigate with `/opencart/` or `/opencart/index.php?route=...`.
- `globalSetup` points to `./storageState/combinedSetup.ts` (not `globalSetup.ts` directly).
- `headless: true` by default; `fullyParallel: true`; retries only on CI.
- Three browser projects active: `chromium`, `firefox`, `webkit`.
- `moduleResolution: "bundler"` in tsconfig — bare imports like `'pages/HomePage'` work without `./` prefix.
- `"type": "commonjs"` in `package.json` — use `require`-compatible patterns when needed.

## Non-Obvious Patterns

- **No npm scripts** — always run tests with `npx playwright test`, never `npm test`.
- **Bare module imports work** — `import { HomePage } from 'pages/HomePage'` resolves because `tsconfig.json` has `paths: { "*": ["./*"] }`. Use bare paths (no `./`) for `pages/`, `utils/`, `fixtures/`, `api/` imports.
- **Page factory chain** — navigation methods return a new page object instance. Always `return new NextPage(this.page)` at the end of navigation methods. Never instantiate page objects inside tests directly if a factory method exists.
- **Locators go in constructor** — all `Locator` properties are `private readonly`, defined in `constructor`, never created inline in methods.
- **`storageStateFixture` uses `{ browser }` not `{ page }`** — required to create a custom context; passing `{ page }` would give a context that ignores storageState.
- **`.playwright/` directory must exist** before `globalSetup` runs — create it with `New-Item -ItemType Directory -Force -Path '.playwright'` on Windows.
- **`globalSetup` reads `config.projects[0].use.baseURL`** — `FullConfig` has no top-level `use`; the root-level `use` is merged into each project before globalSetup runs.
- **DataProvider paths are relative to `utils/`** — `path.resolve(__dirname, filePath)` anchors from the `utils/` directory, not the project root.
- **`MockApiHelper` only intercepts browser-fired requests** — `page.route()` does not intercept `APIRequestContext` calls. Use a stub server (e.g. WireMock) to mock those.
- **`combinedSetup.ts` is the entry point** for global setup — it calls both `globalSetup` and `roleSetup` in sequence. Never register `globalSetup.ts` or `roleSetup.ts` directly in `playwright.config.ts`.
