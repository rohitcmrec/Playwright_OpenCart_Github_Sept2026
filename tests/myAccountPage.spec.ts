import { test, expect } from '../fixtures/loginFixture'


test.beforeEach('before each step', async ({ page }) => {

    await page.goto('/opencart/')
})


test('login', async ({ myAccountPage }) => {
    const title = await myAccountPage.getMyAccountPageTitle()
    expect(title).toBe('My Account');

})