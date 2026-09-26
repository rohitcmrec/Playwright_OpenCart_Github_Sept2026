import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../api/ApiHelper'

let api: ApiHelper

test.beforeEach('dnvd', async ({ request }) => {
    const baseURL = 'djv.com'
    api = new ApiHelper(request, baseURL)
})
test('bvdvs', async ({ request }) => {
    const { status, body } = await api.getRequest('vdvjj')
    expect(status).toBe(200)
    expect(body).toHaveProperty('firtName')
})