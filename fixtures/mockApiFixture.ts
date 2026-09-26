import { test as base, expect } from '@playwright/test'
import { MockApiHelper } from 'api/MockApiHelper'

export const test = base.extend<{ mockApi: MockApiHelper }>({
    mockApi: async ({ page }, use) => {
        const mockApi = new MockApiHelper(page)
        await use(mockApi)
        await mockApi.clearAllMocks()
    }
})

export { expect }
