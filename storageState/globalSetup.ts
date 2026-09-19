import { chromium, FullConfig } from '@playwright/test'
import { HomePage } from '../pages/HomePage'

/**
 * Global Setup — runs ONCE before the entire test suite.
 *
 * Problem it solves:
 *   The loginFixture.ts currently performs a full browser login
 *   (navigate → click My Account → click Login → fill credentials → submit)
 *   before EVERY test. For a suite of 10 tests, that is 10 full login round-trips.
 *
 * Solution:
 *   Log in once here, save the browser's cookies + localStorage to
 *   .playwright/auth.json, then reuse that saved state in every test.
 *   Tests start already logged in — no repeated login UI interactions.
 */
async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Step 1 — Navigate to the OpenCart home page
    await page.goto(`${baseURL}/opencart`);

    // Step 2 & 3 — Use existing page objects to navigate to login and authenticate
    const homePage = new HomePage(page);
    const loginPage = await homePage.clickLoginPage();
    await loginPage.performLogin('rohit1@ibm.com', '1234');

    // Step 4 — Wait until we are on the My Account page
    await page.waitForLoadState('networkidle');

    // Step 5 — Save the authenticated session (cookies + localStorage) to disk
    await page.context().storageState({ path: '.playwright/auth.json' });

    await browser.close();
}

export default globalSetup;
