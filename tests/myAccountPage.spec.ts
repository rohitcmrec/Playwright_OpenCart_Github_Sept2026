import { test, expect } from '../fixtures/loginFixture'


test.beforeEach('before each step', async ({ page }) => {

    await page.goto('/opencart/')
})


test('login', async ({ myAccountPage }) => {
    await expect(myAccountPage.page).toHaveTitle('My Account');

})