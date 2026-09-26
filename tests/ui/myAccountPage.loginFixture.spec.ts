import { test, expect } from '../../fixtures/loginFixture'


test.beforeEach('before each step', async ({ page }) => {

    await page.goto('/opencart/')
})


test('login', async ({ myAccountPage }) => {
    const title = await myAccountPage.getMyAccountPageTitle()
    expect(title).toBe('My Account');
})

test('Mt Account URL using login fixture', async ({ myAccountPage }) => {
    let URL = await myAccountPage.getMyAccountPageURL();
    expect(URL).toContain('route=account/account')
})