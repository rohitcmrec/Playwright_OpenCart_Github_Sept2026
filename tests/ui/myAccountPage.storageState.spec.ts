/**
 * myAccountPage.storageState.spec.ts
 *
 * Demonstrates storageState-based authentication.
 *
 * How it differs from myAccountPage.spec.ts:
 *   - myAccountPage.spec.ts  → uses loginFixture, which does a full UI login
 *                              (navigate + click + fill + submit) before EVERY test.
 *   - This file              → the browser context is pre-loaded with the saved
 *                              session from .playwright/auth.json (written by
 *                              globalSetup.ts). No login UI steps at all.
 *
 * Prerequisite:
 *   playwright.config.ts must have:
 *     globalSetup: './globalSetup.ts'
 *     use: { storageState: '.playwright/auth.json' }
 */
import { test, expect } from '../../fixtures/storageStateFixture'

test('My Account page title is correct when using storageState', async ({ myAccountPage }) => {
    const title = await myAccountPage.getMyAccountPageTitle()
    expect(title).toBe('My Account')
})

test('My Account page URL contains account/account when using storageState', async ({ myAccountPage }) => {
    let URL = await myAccountPage.getMyAccountPageURL()
    expect(URL).toContain('account/account')
})
