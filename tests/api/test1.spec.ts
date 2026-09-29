import { test, expect } from '@playwright/test'
import { ApiHelper } from '../../api/ApiHelper'

let api: ApiHelper

test.beforeEach('setup method', async ({ request }) => {
    const baseURL = 'https://restful-booker.herokuapp.com'
    api = new ApiHelper(request, baseURL)
})
test('verify status code & body format', async ({ request }) => {
    const { status, body } = await api.getRequest('/booking')
    expect(status).toBe(200)
    expect(body[1]).toHaveProperty('bookingid')
})