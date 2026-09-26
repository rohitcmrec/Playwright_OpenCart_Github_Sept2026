/**
 * Mock API Tests — using MockApiHelper via mockApiFixture
 *
 * HOW MOCKING WORKS IN PLAYWRIGHT:
 * ---------------------------------
 * page.route() intercepts requests made through the browser's network stack:
 *   ✅ page.goto(url)
 *   ✅ page.evaluate(() => fetch(url))   ← used in these tests
 *   ✅ XHR / fetch fired by a loaded webpage (e.g. after clicking a button)
 *
 * It does NOT intercept raw APIRequestContext calls (ApiHelper.getRequest etc.).
 * For mocking raw HTTP clients, a stub server (e.g. WireMock) is needed instead.
 *
 * USAGE PATTERN:
 * --------------
 * 1. Import { test, expect } from the mockApiFixture
 * 2. Use the injected mockApi fixture to register mock responses before the action
 * 3. Trigger the request through the page (page.goto or page.evaluate fetch)
 * 4. Assert on the response or UI change
 * 5. clearAllMocks() is called automatically after each test via fixture teardown
 */

import { test, expect } from '../../fixtures/mockApiFixture'

const BASE_URL = 'https://jsonplaceholder.typicode.com'

test('should return mocked GET response for a specific endpoint', async ({ page, mockApi }) => {
    // Register mock: intercept GET /posts/1 and return a fake body
    await mockApi.mockResponse('GET', `${BASE_URL}/posts/1`, {
        status: 200,
        body: { id: 1, title: 'mocked title', body: 'mocked body' }
    })

    // Trigger the request through the browser context using page.evaluate
    const response = await page.evaluate(async (url) => {
        const res = await fetch(url)
        return { status: res.status, body: await res.json() }
    }, `${BASE_URL}/posts/1`)

    expect(response.status).toBe(200)
    expect(response.body.title).toBe('mocked title')
})

test('should return mocked POST response', async ({ page, mockApi }) => {
    // Register mock: intercept POST /posts and return a fake created resource
    await mockApi.mockResponse('POST', `${BASE_URL}/posts`, {
        status: 201,
        body: { id: 101, title: 'new post' }
    })

    // Trigger the POST request through the browser context
    const response = await page.evaluate(async (url) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'test', body: 'test body', userId: 1 })
        })
        return { status: res.status, body: await res.json() }
    }, `${BASE_URL}/posts`)

    expect(response.status).toBe(201)
    expect(response.body.id).toBe(101)
    expect(response.body.title).toBe('new post')
})

test('should pass through to real server when URL is not mocked', async ({ page, mockApi }) => {
    // Only mock /posts/2 — /posts/1 should pass through to the real server
    await mockApi.mockResponse('GET', `${BASE_URL}/posts/2`, {
        status: 200,
        body: { id: 2, title: 'mocked post 2' }
    })

    // /posts/1 is NOT mocked — goes to the real JSONPlaceholder API
    const response = await page.evaluate(async (url) => {
        const res = await fetch(url)
        return { status: res.status, body: await res.json() }
    }, `${BASE_URL}/posts/1`)

    // Real API returns a real post — title will NOT be 'mocked'
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id', 1)
})

test('should clear a specific mock and fall through to real server', async ({ page, mockApi }) => {
    await mockApi.mockResponse('GET', `${BASE_URL}/posts/1`, {
        status: 200,
        body: { id: 1, title: 'mocked title' }
    })

    // Clear the mock before making the call
    await mockApi.clearMock(`${BASE_URL}/posts/1`)

    // Now the request goes to the real server
    const response = await page.evaluate(async (url) => {
        const res = await fetch(url)
        return { status: res.status, body: await res.json() }
    }, `${BASE_URL}/posts/1`)

    expect(response.status).toBe(200)
    // Real server returns the actual post title, not our mocked one
    expect(response.body.title).not.toBe('mocked title')
})
