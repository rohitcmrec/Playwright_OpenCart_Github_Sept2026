# Playwright OpenCart Test Suite

End-to-end and API test suite for [OpenCart](https://naveenautomationlabs.com/opencart) built with **TypeScript + Playwright Test**.

---

## Tech Stack

| Tool | Version |
|---|---|
| Playwright Test | `^1.63.0` |
| TypeScript | `^7.0.2` |
| Node.js | commonjs |
| csv-parse | `^7.0.2` |
| xlsx | `^0.18.5` |

---

## Project Structure

```
.
├── pages/                        # Page Object Model classes
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── MyAccountPage.ts
│   └── RegisterPage.ts
│
├── tests/
│   ├── ui/                       # UI end-to-end specs
│   │   ├── homePage.spec.ts
│   │   ├── loginPage.spec.ts
│   │   ├── registerPage.spec.ts
│   │   ├── myAccountPage.loginFixture.spec.ts
│   │   ├── myAccountPage.storageState.spec.ts
│   │   └── myAccountPage.testUse.spec.ts
│   └── api/                      # API specs
│       ├── test1.spec.ts         # Real HTTP GET via ApiHelper
│       └── mockApiTest.spec.ts   # Browser-intercepted mocks via MockApiHelper
│
├── fixtures/
│   ├── loginFixture.ts           # UI-login fixture (myAccountPage)
│   ├── storageStateFixture.ts    # Pre-auth fixture using saved session
│   ├── mockApiFixture.ts         # MockApiHelper injector with auto-teardown
│   └── FIXTURE_EXPLANATION.md
│
├── api/
│   ├── ApiHelper.ts              # Wraps APIRequestContext for real HTTP calls
│   ├── MockApiHelper.ts          # Wraps page.route() for browser-intercepted mocks
│   └── MOCK_API_GUIDE.md
│
├── storageState/
│   ├── combinedSetup.ts          # Global setup entry point (registered in config)
│   ├── globalSetup.ts            # Logs in once, saves .playwright/auth.json
│   ├── roleSetup.ts              # Saves per-role session files
│   └── STORAGE_STATE_EXPLANATION.md
│
├── utils/
│   └── dataProvider.ts           # JSON / CSV / XLSX data reader
│
├── test-data/                    # Test data files (JSON, CSV, XLSX)
├── .playwright/                  # Session files (gitignored, auto-created)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Playwright browsers installed

```bash
npm install
npx playwright install
```

> **Windows only:** Create the `.playwright/` directory before the first run:
> ```powershell
> New-Item -ItemType Directory -Force -Path '.playwright'
> ```

### Run Tests

```bash
# All tests
npx playwright test

# UI tests only
npx playwright test tests/ui/

# API tests only
npx playwright test tests/api/

# Specific file
npx playwright test tests/ui/loginPage.spec.ts

# Specific test by title
npx playwright test --grep "perform login"

# Specific browser
npx playwright test --project=chromium

# Headed (visible browser)
npx playwright test --headed

# HTML report
npx playwright show-report
```

> **No npm scripts exist.** `package.json` has an empty `scripts: {}`. Always use `npx playwright test` directly.

---

## Configuration

`playwright.config.ts` key settings:

| Setting | Value |
|---|---|
| `baseURL` | `https://naveenautomationlabs.com` |
| `globalSetup` | `./storageState/combinedSetup.ts` |
| `testDir` | `./tests` |
| `fullyParallel` | `true` |
| `headless` | `true` |
| `retries` | `0` locally, `2` on CI |
| Projects | `chromium`, `firefox`, `webkit` |

Navigate to OpenCart pages with `/opencart/` or `/opencart/index.php?route=...`.

---

## Authentication

Three patterns are available:

| Pattern | File | When to use |
|---|---|---|
| UI login per test | `fixtures/loginFixture.ts` | Tests that must exercise the login flow |
| `test.use({ storageState })` | Inline in spec | Simplest pre-auth; easy role switching |
| Custom context fixture | `fixtures/storageStateFixture.ts` | Pre-auth + navigation + automatic teardown |

### How session saving works

`storageState/combinedSetup.ts` is the global setup entry point. It runs two functions in sequence before the entire suite:

1. **`globalSetup`** — logs in as the default user, saves cookies + localStorage to `.playwright/auth.json`.
2. **`roleSetup`** — logs in as each configured role, saves per-role session files to `.playwright/<role>.json`.

Tests can then reuse those sessions without repeating the login UI flow.

---

## Page Object Model

All page objects follow these conventions:

- Locators are **`private readonly`** properties, defined only in the `constructor`.
- Navigation methods **return a new page object** (factory chain):
  ```typescript
  // HomePage → LoginPage → MyAccountPage
  const loginPage = await homePage.clickLoginPage()
  const myAccountPage = await loginPage.performLogin('user@example.com', 'pass')
  ```
- `page: Page` is stored as `private readonly` — not exposed publicly.
- Imports use **bare module paths**: `import { HomePage } from 'pages/HomePage'` (resolved via `tsconfig.json` `paths: { "*": ["./*"] }`).

---

## API Testing

### Real HTTP — `ApiHelper`

`api/ApiHelper.ts` wraps Playwright's `APIRequestContext` for direct HTTP calls (bypasses the browser).

```typescript
import { ApiHelper } from 'api/ApiHelper'

test.beforeEach(async ({ request }) => {
    api = new ApiHelper(request, 'https://restful-booker.herokuapp.com')
})

test('GET /booking', async () => {
    const { status, body } = await api.getRequest('/booking')
    expect(status).toBe(200)
})
```

### Browser-intercepted Mocks — `MockApiHelper`

`api/MockApiHelper.ts` uses `page.route()` to intercept requests **fired through the browser** (fetch/XHR from a loaded page, `page.evaluate`, `page.goto`). It does **not** intercept raw `APIRequestContext` calls.

```typescript
import { test, expect } from 'fixtures/mockApiFixture'

test('mocked GET', async ({ page, mockApi }) => {
    await mockApi.mockResponse('GET', '**/posts/1', {
        status: 200,
        body: { id: 1, title: 'mocked title' }
    })
    const response = await page.evaluate(async (url) => {
        const res = await fetch(url)
        return { status: res.status, body: await res.json() }
    }, 'https://jsonplaceholder.typicode.com/posts/1')

    expect(response.body.title).toBe('mocked title')
})
```

`clearAllMocks()` is called automatically after each test by the fixture — no manual cleanup needed.

See [`api/MOCK_API_GUIDE.md`](api/MOCK_API_GUIDE.md) for the full reference.

---

## DataProvider

`utils/dataProvider.ts` reads test data from three formats. **Paths are relative to the `utils/` directory.**

```typescript
import { DataProvider } from 'utils/dataProvider'
const dp = new DataProvider()

// JSON
const users = dp.getDataFromJson('../test-data/users.json')

// CSV (returns array of objects)
const records = dp.getDataFromCSV('../test-data/records.csv')

// XLSX (second argument = sheet index)
const rows = dp.getDataFromXlsx('../test-data/data.xlsx', 0)
```

---

## TypeScript Config

- `moduleResolution: "bundler"` — enables bare imports without `./` prefix.
- `paths: { "*": ["./*"] }` — resolves `pages/`, `utils/`, `fixtures/`, `api/` from the project root.
- `"type": "commonjs"` in `package.json` — use `require`-compatible patterns when needed.
