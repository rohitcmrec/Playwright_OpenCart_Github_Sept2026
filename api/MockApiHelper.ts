import { Page } from '@playwright/test'

export class MockApiHelper {
    private readonly page: Page
    private readonly registeredPatterns: string[] = []

    constructor(page: Page) {
        this.page = page
    }

    /**
     * Mocks a response for requests matching the given URL pattern and HTTP method.
     * Requests that do NOT match the method are passed through to the real server.
     * Requests whose URL does NOT match the pattern are never intercepted.
     *
     * @param method     HTTP method to intercept, e.g. GET, POST, PUT
     * @param urlPattern Glob or regex pattern passed to page.route(), e.g. ** /api/users
     * @param options    Mock response: status code, body (serialised to JSON), optional headers
     */
    async mockResponse(
        method: string,
        urlPattern: string,
        options: { status: number; body: unknown; headers?: Record<string, string> }
    ): Promise<void> {
        const { status, body, headers } = options

        await this.page.route(urlPattern, (route) => {
            if (route.request().method().toUpperCase() === method.toUpperCase()) {
                route.fulfill({
                    status,
                    contentType: 'application/json',
                    body: JSON.stringify(body),
                    headers
                })
            } else {
                route.continue()
            }
        })

        this.registeredPatterns.push(urlPattern)
    }

    /**
     * Removes the intercept for a specific URL pattern.
     */
    async clearMock(urlPattern: string): Promise<void> {
        await this.page.unroute(urlPattern)
        const index = this.registeredPatterns.indexOf(urlPattern)
        if (index !== -1) {
            this.registeredPatterns.splice(index, 1)
        }
    }

    /**
     * Removes all intercepts registered by this instance.
     * Called automatically in the fixture teardown after each test.
     */
    async clearAllMocks(): Promise<void> {
        for (const pattern of this.registeredPatterns) {
            await this.page.unroute(pattern)
        }
        this.registeredPatterns.length = 0
    }
}
