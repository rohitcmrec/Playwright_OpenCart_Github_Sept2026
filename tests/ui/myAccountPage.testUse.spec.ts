import { test, expect } from '@playwright/test';
import { MyAccountPage } from '../../pages/MyAccountPage';

// Directly instruct Playwright to use the saved storageState session
test.use({ storageState: '.playwright/auth.json' });

test.describe('My Account Page using test.use(storageState)', () => {

    test('My Account page title is correct using test.use()', async ({ page }) => {
        const myAccountPage = new MyAccountPage(page);
        await page.goto('/opencart/index.php?route=account/account');

        const title = await myAccountPage.getMyAccountPageTitle();
        expect(title).toBe('My Account');
    });

    test('My Account page URL contains account/account using test.use()', async ({ page }) => {
        const myAccountPage = new MyAccountPage(page);
        await page.goto('/opencart/index.php?route=account/account');

        const url = await myAccountPage.getMyAccountPageURL();
        expect(url).toContain('account/account');
    });

});
