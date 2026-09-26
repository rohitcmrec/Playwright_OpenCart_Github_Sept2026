# Mock API Layer — Guide & Summary

## What Was Added

Three new files were introduced. Nothing existing was modified.

| File | Purpose |
|---|---|
| `api/MockApiHelper.ts` | Core mock class — wraps Playwright `page.route()` |
| `fixtures/mockApiFixture.ts` | Fixture that injects `MockApiHelper` into tests automatically |
| `tests/api/mockApiTest.spec.ts` | Demo spec showing all mock patterns |

---

## How Playwright Mocking Works — The Key Boundary

### ✅ What Playwright CAN mock — Browser-fired requests

When a webpage is loaded and it internally fires an HTTP request (XHR or fetch), Playwright's `page.route()` sits in the network stack and intercepts it. The mocked response is returned to the page instead of the real server response. Because the page receives different data, the UI built from that data also changes — which you can then assert on.

```
Browser loads page
    └── Page JS fires fetch('/api/users')
            └── page.route() intercepts ✅
                    └── Returns mocked { status: 200, body: [...] }
                            └── UI renders based on mocked data
                                    └── Playwright asserts on changed UI ✅
```

**This is the use case `MockApiHelper` is built for.**

Examples of requests Playwright CAN intercept:
- `page.goto(url)` — navigation requests
- `page.evaluate(() => fetch(url))` — fetch calls evaluated inside the browser
- XHR / fetch triggered by clicking a button or loading a component
- Any network call originating from the browser's JS runtime

---

### ❌ What Playwright CANNOT mock — Raw HTTP client calls

When tests call a raw HTTP client directly (e.g. Playwright's own `APIRequestContext` — used by `ApiHelper.getRequest()`), those requests bypass the browser's network stack entirely. `page.route()` never sees them.

```
Test calls ApiHelper.getRequest('/api/users')
    └── APIRequestContext fires raw HTTP request
            └── page.route() does NOT intercept ❌
                    └── Request goes directly to real server
```

**For mocking raw HTTP client calls, a stub server like WireMock is the right tool** — it spins up a real HTTP server on a port, and you point `ApiHelper`'s base URL at it. Any HTTP client can hit it regardless of context.

---

## MockApiHelper — API Reference

```typescript
// Constructor — pass the Playwright Page instance
const mockApi = new MockApiHelper(page)

// Register a mock response for a URL pattern + HTTP method
await mockApi.mockResponse('GET', '**/api/posts/1', {
    status: 200,
    body: { id: 1, title: 'mocked title' },
    headers: { 'x-custom': 'value' }   // optional
})

// Remove a specific mock
await mockApi.clearMock('**/api/posts/1')

// Remove all mocks registered by this instance
// (called automatically in fixture teardown — no need to call manually)
await mockApi.clearAllMocks()
```

**Unregistered URLs are never intercepted** — they pass through to the real server automatically.

---

## Usage in Tests

Import `test` and `expect` from the fixture. The `mockApi` fixture is injected automatically alongside `page`.

```typescript
import { test, expect } from '../../fixtures/mockApiFixture'

test('UI shows mocked data', async ({ page, mockApi }) => {
    // 1. Register mock before the action that triggers the request
    await mockApi.mockResponse('GET', '**/api/products', {
        status: 200,
        body: [{ id: 1, name: 'Mocked Product' }]
    })

    // 2. Navigate — page JS will fire the request, gets mocked response
    await page.goto('/opencart/index.php?route=product/category')

    // 3. Assert on the UI change driven by the mocked response
    await expect(page.locator('.product-thumb')).toContainText('Mocked Product')
})
```

Teardown is automatic — `clearAllMocks()` is called after every test by the fixture.

---

## When to Use What

| Scenario | Tool |
|---|---|
| Mock a request fired by the browser / page JS | `MockApiHelper` + `page.route()` |
| Assert UI change based on a mocked API response | `MockApiHelper` + `page.route()` |
| Mock a raw HTTP client call (`ApiHelper.getRequest`) | WireMock or another stub server |
| Intercept and modify request headers/body before sending | `page.route()` with `route.continue({ headers })` |

---

## Behaviour Summary

- **Method mismatch** — if a request matches the URL pattern but not the HTTP method, it is passed through to the real server (`route.continue()`).
- **URL not registered** — Playwright's default behaviour applies; request goes to the real server.
- **Multiple mocks** — each `mockResponse()` call adds an independent route. All are tracked internally and cleared together by `clearAllMocks()`.
- **Fixture teardown** — `clearAllMocks()` runs automatically after every test; no manual cleanup needed.
