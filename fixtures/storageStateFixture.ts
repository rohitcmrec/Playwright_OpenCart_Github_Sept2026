import { test as base, expect } from '@playwright/test'
import { MyAccountPage } from 'pages/MyAccountPage'

/**
 * storageStateFixture
 *
 * Extends the base Playwright `test` with a `myAccountPage` fixture that
 * reuses the saved auth session from .playwright/auth.json.
 *
 * Unlike loginFixture.ts (which navigates + logs in through the UI every time),
 * this fixture explicitly creates a new browser context loaded with the saved
 * storageState — making it fully self-contained, no playwright.config.ts change needed.
 *
 * Only tests that import from this fixture get the pre-authenticated context.
 * Other test files (loginPage.spec.ts, registerPage.spec.ts) are unaffected.
 */
export const test = base.extend<{ myAccountPage: MyAccountPage }>({
    myAccountPage: async ({ browser }, use) => {
        // Create a new browser context pre-loaded with the saved auth session.
        // .playwright/auth.json is written by globalSetup.ts on first run.
        const context = await browser.newContext({
            storageState: '.playwright/auth.json'
        });

        const page = await context.newPage();
        await page.goto('/opencart/index.php?route=account/account');

        const myAccountPage = new MyAccountPage(page);
        await use(myAccountPage);

        // Clean up the context after the test completes
        await context.close();
    }
})

export { expect }
